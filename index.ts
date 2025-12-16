/**
 * Job Scout - Get notified when companies you care about post new jobs
 * 
 * Deploy on Val Town or run locally with Node.js/Deno
 */

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
  
  // Lever companies
  { name: "Netflix", ats: "lever", slug: "netflix" },
  
  // Ashby companies
  { name: "Ramp", ats: "ashby", slug: "ramp" },
];

// Optional: Filter jobs by keywords
export const FILTERS = {
  // Only notify for jobs containing ANY of these keywords (empty = all jobs)
  keywords: [] as string[],
  // Exclude jobs containing ANY of these keywords
  exclude: [] as string[],
  // Only notify for jobs in these locations (empty = all locations)
  locations: [] as string[],
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
// DATABASE (using Val Town SQLite or local SQLite)
// ============================================================

const { sqlite } = await import("https://esm.town/v/std/sqlite");
const TABLE_NAME = "job_scout_postings";

async function initDb(): Promise<void> {
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
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

async function isJobKnown(jobId: string): Promise<boolean> {
  const result = await sqlite.execute({
    sql: `SELECT 1 FROM ${TABLE_NAME} WHERE id = :id LIMIT 1`,
    args: { id: jobId },
  });
  return result.rows.length > 0;
}

async function saveJob(job: Job): Promise<void> {
  const now = new Date().toISOString();
  await sqlite.execute({
    sql: `INSERT INTO ${TABLE_NAME} (id, company, title, location, url, department, first_seen, last_seen)
          VALUES (:id, :company, :title, :location, :url, :department, :first_seen, :last_seen)
          ON CONFLICT(id) DO UPDATE SET last_seen = :last_seen, is_active = 1`,
    args: {
      id: job.id,
      company: job.company,
      title: job.title,
      location: job.location || "",
      url: job.url,
      department: job.department || "",
      first_seen: now,
      last_seen: now,
    },
  });
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function formatSlackMessage(job: Job): string {
  return `🆕 *New Job Posted*

*Company:* ${job.company}
*Role:* ${job.title}
*Location:* ${job.location || "Not specified"}
${job.department ? `*Department:* ${job.department}\n` : ""}*Link:* ${job.url}`;
}

async function sendSlackNotification(job: Job): Promise<void> {
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) {
    console.log("No SLACK_WEBHOOK_URL set, skipping notification");
    console.log("Would have sent:", formatSlackMessage(job));
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
  const titleLower = job.title.toLowerCase();
  const locationLower = (job.location || "").toLowerCase();

  // Check exclusions first
  if (FILTERS.exclude.length > 0) {
    const hasExcluded = FILTERS.exclude.some(kw => 
      titleLower.includes(kw.toLowerCase())
    );
    if (hasExcluded) return false;
  }

  // Check keywords
  if (FILTERS.keywords.length > 0) {
    const hasKeyword = FILTERS.keywords.some(kw =>
      titleLower.includes(kw.toLowerCase())
    );
    if (!hasKeyword) return false;
  }

  // Check locations
  if (FILTERS.locations.length > 0) {
    const hasLocation = FILTERS.locations.some(loc =>
      locationLower.includes(loc.toLowerCase())
    );
    if (!hasLocation) return false;
  }

  return true;
}

// ============================================================
// MAIN SCRAPER LOGIC
// ============================================================

const SCRAPERS = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  ashby: fetchAshbyJobs,
};

async function scrapeCompany(company: CompanyConfig): Promise<Job[]> {
  const scraper = SCRAPERS[company.ats];
  if (!scraper) {
    console.error(`No scraper for ATS: ${company.ats}`);
    return [];
  }

  try {
    const jobs = await scraper(company);
    console.log(`Found ${jobs.length} jobs at ${company.name}`);
    return jobs;
  } catch (error) {
    console.error(`Error scraping ${company.name}:`, error);
    return [];
  }
}

async function processJobs(jobs: Job[]): Promise<number> {
  let newJobCount = 0;

  for (const job of jobs) {
    // Skip if doesn't match filters
    if (!matchesFilters(job)) continue;

    // Check if we've seen this job before
    const isKnown = await isJobKnown(job.id);
    
    if (!isKnown) {
      // New job! Save and notify
      await saveJob(job);
      await sendSlackNotification(job);
      newJobCount++;
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return newJobCount;
}

// ============================================================
// ENTRY POINT
// ============================================================

export default async function main(interval?: Interval): Promise<void> {
  console.log(`Job Scout starting at ${new Date().toISOString()}`);
  console.log(`Tracking ${COMPANIES.length} companies`);

  try {
    // Initialize database
    await initDb();

    // Scrape all companies
    let totalJobs = 0;
    let totalNew = 0;

    for (const company of COMPANIES) {
      const jobs = await scrapeCompany(company);
      totalJobs += jobs.length;

      const newCount = await processJobs(jobs);
      totalNew += newCount;

      // Delay between companies to be respectful
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Complete! Found ${totalJobs} total jobs, ${totalNew} new`);
  } catch (error) {
    console.error("Job Scout error:", error);
    throw error;
  }
}

// For local testing
if (import.meta.main) {
  await main();
}
