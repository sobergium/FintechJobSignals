# Job Scout 🔍

Get notified when companies you care about post new jobs.

Track job postings across multiple companies and get instant Slack notifications when new roles appear. Perfect for job seekers, recruiters, investors tracking portfolio hiring velocity, or anyone doing competitive intel.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cron Job      │────▶│   Job Scrapers   │────▶│   SQLite DB     │
│   (scheduled)   │     │   (per ATS)      │     │   (seen jobs)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Slack Webhook  │
                                                 │  (new jobs)     │
                                                 └─────────────────┘
```

1. **Scheduled trigger** - Runs every hour (configurable)
2. **Scrapes job boards** - Checks each company's careers page
3. **Diffs against DB** - Compares to previously seen postings
4. **Notifies on new** - Sends Slack message for each new role

## Supported ATS Platforms

| Platform | Status | URL Pattern |
|----------|--------|-------------|
| Greenhouse | ✅ | `boards.greenhouse.io/{company}` |
| Lever | ✅ | `jobs.lever.co/{company}` |
| Ashby | ✅ | `jobs.ashbyhq.com/{company}` |
| Workday | 🔜 | varies |
| LinkedIn | 🔜 | requires auth |

## Quick Start

### Option 1: Val Town (Recommended)

1. Fork this Val: [job-scout on Val Town](#)
2. Set environment variables:
   - `SLACK_WEBHOOK_URL` - [Create webhook](https://api.slack.com/messaging/webhooks)
   - `BROWSERBASE_API_KEY` - [Get free key](https://browserbase.com)
3. Edit `COMPANIES` array with your targets
4. Run!

### Option 2: Self-Hosted

```bash
# Clone the repo
git clone https://github.com/yourusername/job-scout
cd job-scout

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run once
npm run start

# Or schedule with cron
npm run schedule
```

## Configuration

Edit `config.ts` to add companies you want to track:

```typescript
export const COMPANIES = [
  { name: "Anthropic", ats: "greenhouse", slug: "anthropic" },
  { name: "OpenAI", ats: "greenhouse", slug: "openai" },
  { name: "Stripe", ats: "greenhouse", slug: "stripe" },
  { name: "Figma", ats: "greenhouse", slug: "figma" },
  { name: "Notion", ats: "lever", slug: "notionhq" },
  { name: "Ramp", ats: "ashby", slug: "ramp" },
];
```

### Filter by Keywords (Optional)

Only get notified for roles matching specific keywords:

```typescript
export const FILTERS = {
  keywords: ["engineer", "product", "design"], // any of these
  exclude: ["intern", "contractor"],            // none of these
  locations: ["San Francisco", "Remote"],       // any of these
};
```

## Notification Format

```
🆕 New Job Posted

Company: Anthropic
Role: Senior Software Engineer
Location: San Francisco, CA
Link: https://boards.greenhouse.io/anthropic/jobs/123456

Posted: Dec 16, 2024
```

## Architecture

### Scrapers

Each ATS has its own scraper module since they structure data differently:

- **Greenhouse** - Has a public JSON API (`/jobs.json`)
- **Lever** - Also has JSON endpoint
- **Ashby** - JSON API available
- **Custom careers pages** - Use Browserbase for JS-rendered pages

### Database Schema

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,           -- unique job ID from ATS
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  url TEXT NOT NULL,
  first_seen TEXT NOT NULL,      -- ISO timestamp
  last_seen TEXT NOT NULL,       -- ISO timestamp  
  is_active INTEGER DEFAULT 1    -- track when jobs are removed
);
```

### Rate Limiting

Be respectful:
- Default: 1 request per company per hour
- Randomized delays between requests
- Respects robots.txt

## Extending

### Add a New ATS

1. Create scraper in `scrapers/{ats-name}.ts`
2. Implement the `Scraper` interface:

```typescript
interface Scraper {
  fetchJobs(company: CompanyConfig): Promise<Job[]>;
}
```

3. Register in `scrapers/index.ts`

### Add New Notification Channels

Implement the `Notifier` interface:

```typescript
interface Notifier {
  send(job: Job): Promise<void>;
}
```

Built-in: Slack, Discord, Email (via Resend)

## Use Cases

- **Job Seekers** - Get first-mover advantage on new postings
- **Recruiters** - Track competitor hiring patterns
- **VCs** - Monitor portfolio company hiring velocity
- **Researchers** - Analyze hiring trends over time

## Inspired By

- [Slack Scout](https://x.com/SarahChieng) by Sarah Chieng
- [f5bot](https://f5bot.com)

## License

MIT

---

Built by [Emma @ Fika Ventures](https://twitter.com/yourhandle) 💼
