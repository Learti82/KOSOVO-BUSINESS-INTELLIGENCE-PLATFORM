# KosovaIntel — Kosovo Business Intelligence Platform

Professional due diligence reports on Kosovo companies, built from public records, government procurement data, and media analysis.

## What it does

KosovaIntel is a commercial business-intelligence service. Clients (banks, law firms, investors) order reports on Kosovo companies for €299–€1,199. The platform combines:

- **ARBK** — Kosovo Business Registration Agency data
- **e-Prokurimi** — Public procurement contracts (via OCDS open contracting standard)
- **Open Government Data** — Kosovo Open Data Portal
- **Media screening** — Koha, Gazeta Express, Prishtina Insight, Zëri
- **Analyst commentary** + AI-generated risk narrative (Claude)
- Output: a professional PDF report

Two-sided platform:
- **Client site** — order reports, track status, download PDFs
- **Analyst dashboard** — manage orders, review scraped data, edit reports, publish

## Tech stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Scraping**: cheerio + axios (+ playwright for JS-heavy pages)
- **PDF**: Puppeteer
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **Auth**: JWT (roles: `client`, `analyst`, `admin`)
- **Email**: nodemailer
- **Jobs**: Bull + Redis (optional)

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- (Optional) Redis for job queue

## Setup

```bash
# 1. Install dependencies (root + server + client)
npm run install:all

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY at minimum

# 3. Create database
createdb kosovaintel

# 4. Run migrations
npm run db:migrate

# 5. Seed sample data
npm run db:seed

# 6. Start dev servers (client :5173, server :3001)
npm run dev
```

## Default logins

After seeding:
- **Analyst**: `analyst@kosovaintel.com` / `analyst123`
- **Client**: `demo@client.com` / `demo1234`

## Project structure

```
kosovaintel/
├── client/                  # React frontend (public + admin)
│   └── src/
│       ├── pages/           # Home, Order, Login, Dashboard, admin/*
│       ├── components/
│       └── lib/api.ts       # typed fetch wrapper
├── server/
│   └── src/
│       ├── routes/          # auth, companies, orders, reports, admin
│       ├── services/
│       │   ├── scrapers/    # ARBK, procurement, news, enrich
│       │   ├── ai.service.ts     # Claude integration
│       │   ├── pdf.service.ts    # Puppeteer PDF generation
│       │   └── email.service.ts
│       ├── db/              # schema.sql, migrate, seed
│       ├── middleware/
│       └── config/pricing.ts
└── uploads/reports/         # generated PDFs
```

## Public data sources

All scrapers target publicly available government data — legally permissible under Kosovo Law No. 04/L-065.

| Source | URL | What we extract |
|---|---|---|
| ARBK | https://arbk.rks-gov.net | Company registration, owners, status |
| e-Prokurimi | https://e-prokurimi.rks-gov.net | Procurement contracts (OCDS API) |
| Open Procurement | https://www.prokurimihapur.org/ | Civil society procurement mirror |
| Open Data Kosovo | https://opendata.rks-gov.net/en/ | Sectoral & statistical datasets |
| Cadastral Agency | https://akk.rks-gov.net/en | Property records |
| Supreme Court | https://supreme.gjyqesori-rks.org | Case law |
| Koha | https://www.koha.net | News |
| Gazeta Express | https://www.gazetaexpress.com | News |
| Prishtina Insight | https://prishtinainsight.com | News |
| Zëri | https://zeri.info | News |

## Triggering a scrape

- Via UI: `/admin/scraper` → enter company name → Scrape
- Via API: `POST /api/analyst/scrape/company` with `{ "name": "Kastrati Group" }` (auth required)

## Generating a report PDF

1. Open `/admin/orders/:id`
2. Click **Rescrape** (top of left panel) to refresh data
3. Click **Generate AI Narrative** (uses Claude API)
4. Fill in analyst summary, risk rating, recommendations
5. Click **Generate PDF** → preview saved to `uploads/reports/{order_number}.pdf`
6. Click **Publish & Notify** → marks order complete, emails client

## Pricing

Configured in `server/src/config/pricing.ts`:

```ts
basic:         €299
standard:      €599
comprehensive: €1199

urgency multiplier:
  standard (48h): 1.0x
  express  (24h): 1.5x
  urgent   (12h): 2.0x
```

## Important implementation notes

- **PII hashing**: Person ID numbers are SHA-256 hashed before storage (GDPR-aligned).
- **Scraper politeness**: 1–2 second delays between requests, descriptive User-Agent.
- **Rate limiting**: Auth routes 10/min, public routes 60/min.
- **Confidentiality**: Every PDF includes "CONFIDENTIAL — Prepared exclusively for [CLIENT]" on every page.
- **Failure handling**: Scrapers catch errors gracefully, log to `scrape_jobs`, return partial results. Platform still functions if one source is unavailable.
- **Name matching**: Company names are normalized (lowercase, strip legal-form suffix, strip diacritics) for fuzzy matching across sources.
- **Albanian language**: Original Albanian text is preserved in DB.

## API reference (selected)

### Public
- `GET  /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/companies/search?q=NAME`
- `GET  /api/companies/:id/preview`
- `POST /api/orders/request`

### Client (JWT, role: client)
- `GET  /api/orders/client/orders`
- `GET  /api/orders/client/orders/:id`
- `GET  /api/client/orders/:id/report` (PDF download)
- `POST /api/orders/client/orders/:id/pay`

### Analyst / Admin (JWT, role: analyst | admin)
- `GET   /api/analyst/orders`
- `GET   /api/analyst/orders/:id`
- `PATCH /api/analyst/orders/:id/assign`
- `PATCH /api/analyst/orders/:id/status`
- `GET   /api/analyst/companies/search`
- `GET   /api/analyst/companies/:id`
- `POST  /api/analyst/companies/:id/scrape`
- `POST  /api/analyst/scrape/company`
- `GET   /api/analyst/scrape/jobs`
- `GET   /api/analyst/reports/:order_id`
- `PUT   /api/analyst/reports/:order_id`
- `POST  /api/analyst/reports/:order_id/generate-ai`
- `POST  /api/analyst/reports/:order_id/generate-pdf`
- `POST  /api/analyst/reports/:order_id/publish`
- `GET   /api/analyst/stats`

## License & legal

Source code is proprietary. The platform scrapes only publicly available government data; data is processed for legitimate business intelligence purposes. Reports are confidential to the named recipient and not transferable.
