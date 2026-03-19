/**
 * FintechJobSignals
 * Forked from ewatfika/jobscout — extended for fintech/payments intelligence.
 *
 * Changes from original:
 *  - COMPANIES and FILTERS imported from companies_v2.ts (not hardcoded here)
 *  - CompanyConfig extended with segment, tags, notes, slugVerified
 *  - FILTERS wired to ROLE_TAXONOMY from companies_v2.ts
 *  - Slack message enriched with segment + matched role tags
 *  - Companies with empty slug (custom ATS) are skipped with a log message
 */

import Database from "better-sqlite3";
import path from "path";
import { fetchGreenhouseJobs } from "./scrapers/greenhouse";
import { fetchLeverJobs } from "./scrapers/lever";
import { fetchAshbyJobs } from "./scrapers/ashby";
import { fetchBreezyJobs } from "./scrapers/breezy";
import { fetchBambooJobs } from "./scrapers/bamboohr";
import { fetchRipplingJobs } from "./scrapers/rippling";

import { COMPANIES, ROLE_TAXONOMY } from "./companies_v2";

// ============================================================
// TYPES
// ============================================================

export type Segment =
  | "XBORDER"
  | "IN_PG"
  | "IN_INFRA"
  | "IN_REGTECH"
  | "US_FINTECH"
  | "AI_CREDIT"
  | "CRYPTO_COMP";

export type ATS =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "breezy"
  | "bamboohr"
  | "rippling"
  | "workday"
  | "custom";

export interface CompanyConfig {
  name: string;
  ats: ATS;
  slug: string;
  segment: Segment;
  tags: string[];
  notes?: string;
  slugVerified?: boolean;
}

export interface Job {
  id: string;
  company: string;
  segment: Segment;
  title: string;
  location: string;
  url: string;
  department?: string;
  postedAt?: string;
  matchedRoles?: string[];   // which ROLE_TAXONOMY categories this job matched
}

// ============================================================
// FILTERS
// Built from ROLE_TAXONOMY — only alert on compliance-relevant roles.
// Set ROLE_FILTER_ENABLED=false in .env to receive ALL roles.
// ============================================================

const ROLE_FILTER_ENABLED = process.env.ROLE_FILTER_ENABLED !== "false";

// Flatten all taxonomy keywords into one list for keyword matching
const ALL_TAXONOMY_KEYWORDS = Object.values(ROLE_TAXONOMY).flat();

// These keywords in a title will suppress the alert regardless
const EXCLUDE_KEYWORDS = [
  "intern",
  "internship",
  "contractor",
  "apprentice",
  "student",
];

// ============================================================
// DATABASE
// ============================================================

const DB_PATH = path.join(process.cwd(), "jobs.db");
const db = new Database(DB_PATH);

function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id          TEXT PRIMARY KEY,
      company     TEXT NOT NULL,
      segment     TEXT NOT NULL DEFAULT '',
      title       TEXT NOT NULL,
      location    TEXT,
      url         TEXT NOT NULL,
      department  TEXT,
      matched_roles TEXT,
      first_seen  TEXT NOT NULL,
      last_seen   TEXT NOT NULL,
      is_active   INTEGER DEFAULT 1
    )
  `);
}

function isJobKnown(jobId: string): boolean {
  const row = db.prepare("SELECT 1 FROM jobs WHERE id = ?").get(jobId);
  return row !== undefined;
}

function saveJob(job: Job): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO jobs (id, company, segment, title, location, url, department, matched_roles, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_seen = ?, is_active = 1
  `).run(
    job.id,
    job.company,
    job.segment,
    job.title,
    job.location || "",
    job.url,
    job.department || "",
    (job.matchedRoles || []).join(","),
    now,
    now,
    now,
  );
}

// ============================================================
// ROLE MATCHING
// ============================================================

function matchRoleTaxonomy(title: string, department?: string): string[] {
  const haystack = `${title} ${department || ""}`.toLowerCase();
  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(ROLE_TAXONOMY)) {
    if (keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      matched.push(category);
    }
  }

  return matched;
}

// ============================================================
// FILTERING
// ============================================================

function matchesFilters(job: Job): boolean {
  const title = job.title.toLowerCase();

  // Always exclude noise roles
  if (EXCLUDE_KEYWORDS.some((kw) => title.includes(kw))) {
    return false;
  }

  // If role filter is on, only pass jobs matching taxonomy
  if (ROLE_FILTER_ENABLED) {
    const hasMatch = ALL_TAXONOMY_KEYWORDS.some((kw) =>
      title.includes(kw.toLowerCase())
    );
    if (!hasMatch) return false;
  }

  return true;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

const SEGMENT_LABELS: Record<Segment, string> = {
  XBORDER:     "Cross-border",
  IN_PG:       "India · Payments",
  IN_INFRA:    "India · Infra",
  IN_REGTECH:  "India · Regtech",
  US_FINTECH:  "US Fintech",
  AI_CREDIT:   "AI · Credit/Fraud",
  CRYPTO_COMP: "Crypto Compliance",
};

const ROLE_LABELS: Record<string, string> = {
  compliance:   "Compliance",
  aml_kyc:      "AML / KYC",
  risk:         "Risk",
  payments_ops: "Payments Ops",
  data_privacy: "Data Privacy",
  regtech:      "Regtech",
  policy_govt:  "Policy / Govt Affairs",
};

function formatSlackMessage(job: Job): string {
  const roleLabels = (job.matchedRoles || [])
    .map((r) => ROLE_LABELS[r] || r)
    .join(", ");

  const lines = [
    `🔍 *New Fintech Signal*`,
    ``,
    `*Company:* ${job.company}`,
    `*Segment:* ${SEGMENT_LABELS[job.segment] || job.segment}`,
    `*Role:* ${job.title}`,
    `*Location:* ${job.location || "Not specified"}`,
    job.department ? `*Department:* ${job.department}` : null,
    roleLabels ? `*Signal type:* ${roleLabels}` : null,
    `*Link:* ${job.url}`,
  ];

  return lines.filter(Boolean).join("\n");
}

async function sendSlackNotification(job: Job): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(`  [no webhook] Would notify: ${job.title} @ ${job.company}`);
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: formatSlackMessage(job) },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Job" },
              url: job.url,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack error: ${response.status} ${response.statusText}`);
  }
}

// ============================================================
// SCRAPER LOGIC
// ============================================================

const SCRAPERS: Partial<Record<ATS, (company: CompanyConfig) => Promise<Job[]>>> = {
  greenhouse: fetchGreenhouseJobs as any,
  lever:      fetchLeverJobs as any,
  ashby:      fetchAshbyJobs as any,
  breezy:     fetchBreezyJobs as any,
  bamboohr:   fetchBambooJobs as any,
  rippling:   fetchRipplingJobs as any,
};

async function scrapeCompany(company: CompanyConfig): Promise<Job[]> {
  // Skip companies with no slug (custom ATS — Phase 2)
  if (!company.slug) {
    console.log(`  ⏭  ${company.name}: skipped (custom ATS — slug not set)`);
    return [];
  }

  const scraper = SCRAPERS[company.ats];
  if (!scraper) {
    console.log(`  ⏭  ${company.name}: skipped (no scraper for ${company.ats})`);
    return [];
  }

  try {
    const rawJobs = await scraper(company);

    // Attach segment + role matches to each job
    const jobs: Job[] = rawJobs.map((j: any) => ({
      ...j,
      segment: company.segment,
      matchedRoles: matchRoleTaxonomy(j.title, j.department),
    }));

    console.log(`  ✓  ${company.name}: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error(`  ✗  Error scraping ${company.name}:`, error);
    return [];
  }
}

async function processJobs(jobs: Job[]): Promise<number> {
  let newCount = 0;

  for (const job of jobs) {
    if (!matchesFilters(job)) continue;
    if (isJobKnown(job.id)) continue;

    saveJob(job);
    await sendSlackNotification(job);
    newCount++;

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return newCount;
}

// ============================================================
// MAIN
// ============================================================

async function run(): Promise<void> {
  const activeCompanies = COMPANIES.filter((c) => c.slug); // only scrape companies with slugs set
  const skippedCompanies = COMPANIES.filter((c) => !c.slug);

  console.log(`\n🔍 FintechJobSignals running at ${new Date().toISOString()}`);
  console.log(`   Tracking: ${activeCompanies.length} companies`);
  console.log(`   Skipped (custom ATS): ${skippedCompanies.length} companies`);
  console.log(`   Role filter: ${ROLE_FILTER_ENABLED ? "ON (compliance/reg/risk/payments only)" : "OFF (all roles)"}`);
  console.log("");

  let totalNew = 0;

  for (const company of activeCompanies) {
    const jobs = await scrapeCompany(company);
    const newCount = await processJobs(jobs);
    totalNew += newCount;

    // Delay between companies to be polite
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n✅ Done. ${totalNew} new signal(s) found.\n`);

  if (skippedCompanies.length > 0) {
    console.log(`ℹ️  Skipped (need custom scrapers):`);
    skippedCompanies.forEach((c) => console.log(`   - ${c.name}`));
    console.log("");
  }
}

// ============================================================
// ENTRY POINT
// ============================================================

initDb();
run().catch(console.error);
