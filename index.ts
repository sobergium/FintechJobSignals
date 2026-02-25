/**
 * Job Scout - Get notified when companies you care about post new jobs
 *
 * Self-hosted version. Runs on Node.js, scheduled via system cron.
 * See README.md for setup instructions.
 */

import Database from "better-sqlite3";
import path from "path";
import { fetchGreenhouseJobs } from "./scrapers/greenhouse";
import { fetchLeverJobs } from "./scrapers/lever";
import { fetchAshbyJobs } from "./scrapers/ashby";

// ============================================================
// CONFIGURATION - Edit this section!
// ============================================================

export const COMPANIES: CompanyConfig[] = [
  // Greenhouse companies
  { name: "Anthropic", ats: "greenhouse", slug: "anthropic" },
  { name: "OpenAI", ats: "greenhouse", slug: "openai" },
  { name: "Stripe", ats: "greenhouse", slug: "stripe" },
  { name: "Figma", ats: "greenhouse", slug: "figma" },
  { name: "Notion", ats: "greenhouse", slug: "notion" },
  { name: "Vercel", ats: "greenhouse", slug: "vercel" },
  { name: "Airtable", ats: "greenhouse", slug: "airtable" },

  // Lever companies
  { name: "Netflix", ats: "lever", slug: "netflix" },

  // Ashby companies
  { name: "Ramp", ats: "ashby", slug: "ramp" },
];

// Optional: Filter jobs by keywords (leave empty arrays to get all jobs)
export const FILTERS = {
  keywords: [] as string[],   // e.g. ["engineer", "product"]
  exclude: [] as string[],    // e.g. ["intern", "contractor"]
  locations: [] as string[],  // e.g. ["San Francisco", "Remote"]
};

// ============================================================
// TYPES
// ============================================================

export interface CompanyConfig {
  name: string;
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
}

export interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  department?: string;
  postedAt?: string;
}

// ============================================================
// DATABASE
// ============================================================

const DB_PATH = path.join(process.cwd(), "jobs.db");
const db = new Database(DB_PATH);

function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      url TEXT NOT NULL,
      department TEXT,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
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
    INSERT INTO jobs (id, company, title, location, url, department, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_seen = ?, is_active = 1
  `).run(
    job.id, job.company, job.title, job.location || "",
    job.url, job.department || "", now, now, now
  );
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function formatSlackMessage(job: Job): string {
  return [
    `🆕 *New Job Posted*`,
    ``,
    `*Company:* ${job.company}`,
    `*Role:* ${job.title}`,
    `*Location:* ${job.location || "Not specified"}`,
    job.department ? `*Department:* ${job.department}` : null,
    `*Link:* ${job.url}`,
  ].filter(Boolean).join("\n");
}

async function sendSlackNotification(job: Job): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("  [no webhook] Would notify:", job.title, "@", job.company);
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
// FILTERING
// ============================================================

function matchesFilters(job: Job): boolean {
  const title = job.title.toLowerCase();
  const location = (job.location || "").toLowerCase();

  if (FILTERS.exclude.length > 0) {
    if (FILTERS.exclude.some((kw) => title.includes(kw.toLowerCase()))) {
      return false;
    }
  }

  if (FILTERS.keywords.length > 0) {
    if (!FILTERS.keywords.some((kw) => title.includes(kw.toLowerCase()))) {
      return false;
    }
  }

  if (FILTERS.locations.length > 0) {
    if (!FILTERS.locations.some((loc) => location.includes(loc.toLowerCase()))) {
      return false;
    }
  }

  return true;
}

// ============================================================
// SCRAPER LOGIC
// ============================================================

const SCRAPERS = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  ashby: fetchAshbyJobs,
};

async function scrapeCompany(company: CompanyConfig): Promise<Job[]> {
  const scraper = SCRAPERS[company.ats];
  if (!scraper) {
    console.error(`  No scraper for ATS: ${company.ats}`);
    return [];
  }
  try {
    const jobs = await scraper(company);
    console.log(`  ${company.name}: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error(`  Error scraping ${company.name}:`, error);
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
  console.log(`\n🔍 Job Scout running at ${new Date().toISOString()}`);
  console.log(`   Tracking ${COMPANIES.length} companies\n`);

  let totalNew = 0;

  for (const company of COMPANIES) {
    const jobs = await scrapeCompany(company);
    const newCount = await processJobs(jobs);
    totalNew += newCount;

    // Delay between companies
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n✅ Done! ${totalNew} new job(s) found.\n`);
}

// ============================================================
// ENTRY POINT
// ============================================================

initDb();
run().catch(console.error);
