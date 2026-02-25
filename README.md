# Job Scout 🔍

Get notified when companies you care about post new jobs.

Track job postings across multiple companies and get instant Slack notifications when new roles appear. Perfect for job seekers, recruiters, or investors tracking portfolio hiring velocity.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   cron job      │────▶│   Job Scrapers   │────▶│   SQLite DB     │
│   (scheduled)   │     │   (per ATS)      │     │   (seen jobs)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Slack Webhook  │
                                                 │  (new jobs only)│
                                                 └─────────────────┘
```

1. **Scheduled trigger** — runs every hour via system cron (configurable)
2. **Scrapes job boards** — hits each company's ATS API
3. **Diffs against DB** — compares to previously seen postings in SQLite
4. **Notifies on new** — sends a Slack message for each new role

## Supported ATS Platforms

| Platform | Status | URL Pattern |
|----------|--------|-------------|
| Greenhouse | ✅ | `boards.greenhouse.io/{slug}` |
| Lever | ✅ | `jobs.lever.co/{slug}` |
| Ashby | ✅ | `jobs.ashbyhq.com/{slug}` |
| Breezy HR | ✅ | `{slug}.breezy.hr` |
| BambooHR | ✅ | `{slug}.bamboohr.com` |
| Rippling | ✅ | `ats.rippling.com/{slug}/jobs` |
| Workday | 🔜 | varies |
| LinkedIn | 🔜 | requires auth |

## Quick Start

**Requirements:** Node.js 18+

```bash
# Clone the repo
git clone https://github.com/ewatfika/jobscout
cd job-scout

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your SLACK_WEBHOOK_URL

# Run once to test
npm start
```

To get a Slack webhook URL: [Create an incoming webhook](https://api.slack.com/messaging/webhooks)

### Schedule with Cron

Job Scout is designed to be triggered by your system's cron scheduler. Each run checks for new jobs and exits.

```bash
# Open your crontab
crontab -e

# Add one of these lines:
0 * * * * cd /path/to/job-scout && npm start >> /var/log/job-scout.log 2>&1   # every hour
0 9 * * * cd /path/to/job-scout && npm start >> /var/log/job-scout.log 2>&1   # every day at 9am
```

Use [crontab.guru](https://crontab.guru) to build a custom schedule.

## Configuration

Edit the `COMPANIES` array in `index.ts`:

```typescript
export const COMPANIES: CompanyConfig[] = [
  { name: "Anthropic",       ats: "greenhouse", slug: "anthropic" },
  { name: "Stripe",          ats: "greenhouse", slug: "stripe" },
  { name: "Netflix",         ats: "lever",      slug: "netflix" },
  { name: "Ramp",            ats: "ashby",      slug: "ramp" },
  { name: "PathSpot",        ats: "breezy",     slug: "pathspot" },
  { name: "Elementary",      ats: "bamboohr",   slug: "elementary" },
  { name: "Bowery Valuation",ats: "rippling",   slug: "bowery-valuation" },
];
```

To find a company's slug, look at their careers page URL:
- `boards.greenhouse.io/anthropic` → slug is `anthropic`
- `jobs.lever.co/netflix` → slug is `netflix`
- `jobs.ashbyhq.com/ramp` → slug is `ramp`

### Filter by Keywords (Optional)

Only get notified for roles matching specific keywords:

```typescript
export const FILTERS = {
  keywords: ["engineer", "product"],     // must match one of these
  exclude:  ["intern", "contractor"],    // must not match any of these
  locations: ["San Francisco", "Remote"], // must match one of these
};
```

Leave any array empty to skip that filter.

## Notification Format

```
🆕 New Job Posted

Company: Anthropic
Role: Senior Software Engineer
Location: San Francisco, CA
Department: Engineering
Link: https://boards.greenhouse.io/anthropic/jobs/123456
```

## Architecture

### Scrapers

Each ATS has its own scraper module since they all structure data differently:

- **Greenhouse** — public JSON API at `/v1/boards/{slug}/jobs`
- **Lever** — public JSON API at `/v0/postings/{slug}`
- **Ashby** — GraphQL API at `jobs.ashbyhq.com/api/non-user-graphql`

### Database

SQLite via `better-sqlite3`. A `jobs.db` file is created locally on first run.

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,        -- unique job ID (ats-slug-jobid)
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  url TEXT NOT NULL,
  department TEXT,
  first_seen TEXT NOT NULL,   -- ISO timestamp
  last_seen TEXT NOT NULL,    -- ISO timestamp
  is_active INTEGER DEFAULT 1
);
```

### Extending

**Add a new ATS:** create `scrapers/{ats}.ts`, implement the `Scraper` interface, and register it in `index.ts`.

**Add new notification channels:** the `sendSlackNotification` function is easy to extend — Discord, email via Resend, or anything else with a webhook.

## Use Cases

- **Job seekers** — get first-mover advantage on new postings
- **Recruiters** — track competitor hiring patterns
- **VCs** — monitor portfolio company hiring velocity

## License

MIT

---

Built by [Emma @ Fika Ventures](https://www.linkedin.com/in/emma-w-42a469182/) 💼
