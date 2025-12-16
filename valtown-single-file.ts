/**
 * Job Scout - Single File Val Town Version
 * 
 * Get notified when companies you care about post new jobs.
 * Deploy this on Val Town and set your SLACK_WEBHOOK_URL env var.
 * 
 * Built by Emma @ Fika Ventures
 * https://github.com/yourrepo/job-scout
 */

const { sqlite } = await import("https://esm.town/v/std/sqlite");

// ============================================================
// 🔧 CONFIGURATION - Edit this section!
// ============================================================

const COMPANIES = [
  // Greenhouse companies (most common ATS)
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

// Optional filters (leave empty arrays to get all jobs)
const FILTERS = {
  keywords: [],     // e.g., ["engineer", "product", "design"]
  exclude: [],      // e.g., ["intern", "contractor"]
  locations: [],    // e.g., ["San Francisco", "Remote", "New York"]
};

// ============================================================
// Types
// ============================================================

interface CompanyConfig {
  name: string;
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
}

interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  department?: string;
}

// ============================================================
// Scrapers
// ============================================================

async function fetchGreenhouseJobs(company: CompanyConfig): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs`;
  const res = await fetch(url);
  if (!res.ok) return [];
  
  const data = await res.json();
  return data.jobs.map((job: any) => ({
    id: `gh-${company.slug}-${job.id}`,
    company: company.name,
    title: job.title,
    location: job.location?.name || "Not specified",
    url: job.absolute_url,
    department: job.departments?.[0]?.name,
  }));
}

async function fetchLeverJobs(company: CompanyConfig): Promise<Job[]> {
  const url = `https://api.lever.co/v0/postings/${company.slug}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  
  const data = await res.json();
  return data.map((job: any) => ({
    id: `lever-${company.slug}-${job.id}`,
    company: company.name,
    title: job.text,
    location: job.categories?.location || "Not specified",
    url: job.hostedUrl,
    department: job.categories?.team,
  }));
}

async function fetchAshbyJobs(company: CompanyConfig): Promise<Job[]> {
  const url = "https://jobs.ashbyhq.com/api/non-user-graphql";
  const query = {
    operationName: "ApiJobBoardWithTeams",
    variables: { organizationHostedJobsPageName: company.slug },
    query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
      jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
        jobPostings { id title location department }
      }
    }`,
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!res.ok) return [];
  
  const data = await res.json();
  const postings = data.data?.jobBoard?.jobPostings || [];
  return postings.map((job: any) => ({
    id: `ashby-${company.slug}-${job.id}`,
    company: company.name,
    title: job.title,
    location: job.location || "Not specified",
    url: `https://jobs.ashbyhq.com/${company.slug}/${job.id}`,
    department: job.department,
  }));
}

const SCRAPERS = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  ashby: fetchAshbyJobs,
};

// ============================================================
// Database
// ============================================================

const TABLE = "job_scout_v1";

async function initDb() {
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      company TEXT,
      title TEXT,
      location TEXT,
      url TEXT,
      first_seen TEXT
    )
  `);
}

async function isKnown(id: string): Promise<boolean> {
  const r = await sqlite.execute({
    sql: `SELECT 1 FROM ${TABLE} WHERE id = :id`,
    args: { id },
  });
  return r.rows.length > 0;
}

async function saveJob(job: Job) {
  await sqlite.execute({
    sql: `INSERT OR IGNORE INTO ${TABLE} (id, company, title, location, url, first_seen)
          VALUES (:id, :company, :title, :location, :url, :first_seen)`,
    args: { ...job, first_seen: new Date().toISOString() },
  });
}

// ============================================================
// Notifications
// ============================================================

async function notify(job: Job) {
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) {
    console.log("New job (no webhook set):", job.title, "@", job.company);
    return;
  }

  const msg = `🆕 *New Job Posted*\n\n*${job.company}*\n${job.title}\n📍 ${job.location}\n${job.department ? `🏢 ${job.department}\n` : ""}\n<${job.url}|View Job →>`;
  
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [{ type: "section", text: { type: "mrkdwn", text: msg } }],
    }),
  });
}

// ============================================================
// Filtering
// ============================================================

function matchesFilters(job: Job): boolean {
  const title = job.title.toLowerCase();
  const loc = (job.location || "").toLowerCase();
  
  if (FILTERS.exclude.length && FILTERS.exclude.some(k => title.includes(k.toLowerCase()))) {
    return false;
  }
  if (FILTERS.keywords.length && !FILTERS.keywords.some(k => title.includes(k.toLowerCase()))) {
    return false;
  }
  if (FILTERS.locations.length && !FILTERS.locations.some(l => loc.includes(l.toLowerCase()))) {
    return false;
  }
  return true;
}

// ============================================================
// Main
// ============================================================

export default async function jobScout(interval: Interval) {
  console.log(`🔍 Job Scout running at ${new Date().toISOString()}`);
  await initDb();
  
  let totalNew = 0;
  
  for (const company of COMPANIES) {
    try {
      const scraper = SCRAPERS[company.ats];
      const jobs = await scraper(company);
      console.log(`  ${company.name}: ${jobs.length} jobs`);
      
      for (const job of jobs) {
        if (!matchesFilters(job)) continue;
        if (await isKnown(job.id)) continue;
        
        await saveJob(job);
        await notify(job);
        totalNew++;
        
        await new Promise(r => setTimeout(r, 300));
      }
      
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  Error with ${company.name}:`, e);
    }
  }
  
  console.log(`✅ Done! ${totalNew} new jobs found`);
}
