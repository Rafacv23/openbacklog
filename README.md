# openbacklog.app

Open-source backlog manager for gamers.

Positioning: **help players decide what to play and finish more games** (not just catalog titles).

## Vision

`openbacklog.app` is a web platform (with mobile expansion in mind) inspired by Backloggd, but differentiated by:

- Real backlog productivity (planning, prioritization, completion focus)
- Practical AI features (smart recommendations and habit insights)
- Better UX and lower manual friction
- Lightweight social layer to support engagement

## Initial Product Scope

### Core parity + base value

- Game tracking and personal biblioteca (Backlog-style)
- Ratings and reviews (Steam-like model)
- Time-to-beat tracking (HTLB-style integration)
- Friends (followers model) + activity feed
- Completion streaks and goals
- Monthly release calendar + reminders

### Differentiators from day one

- "What should I play today?" assistant
- Dynamic backlog prioritization
- Estimated total time to clear backlog
- Abandonment-risk signals ("likely to drop")
- Smart recommendations for Premium users
- Minimal-friction import (Steam first)

## Suggested Technical Stack

### Frontend

- Next.js (App Router, Server Components)
- TypeScript
- Tailwind CSS + shadcn/ui
- next-intl for localization (`en`, `es` first)

### Backend (current decision)

Start with **Next.js backend** in the same app to move faster in the MVP:

- Route Handlers + server-side services in `src`
- Type-safe domain modules under `src/server/*`
- Better Auth for authentication
- Keep clear service boundaries to allow future extraction into a dedicated API app later

### Data and infra

- Turso (libSQL/SQLite) as primary relational store
- Drizzle ORM + Drizzle Kit migrations
- Redis (cache, queues, rate limiting, feed fan-out)
- Object storage for user media (screenshots/avatars)
- Background workers for sync/import/recommendations/reminders

### Integrations

- IGDB API (game metadata)
- Steam import (phase 1 external sync)

### IGDB Integration Strategy (Implemented)

Game reads should be **DB-first**:

1. Query local Turso data first.
2. If results are missing or stale, query IGDB.
3. Upsert normalized data in Turso.
4. Return data from local store whenever possible.

This pattern reduces external dependency, controls rate usage, and improves latency.

Current internal endpoint:

- `GET /api/games/search?query=<text>&limit=<n>`
  - Rate limited per IP
  - Uses local cache + in-flight deduplication for burst traffic
  - Uses retry/backoff for IGDB transient failures
  - Writes IGDB results into `games` table for reuse

### Current Repository Setup

- Single Next.js app repository (no workspaces)
- One codebase for UI + backend endpoints during MVP
- Keep modules organized by domain under `src/*`

### Landing Header (Current)

- Header extracted to `src/components/landing/header.tsx`.
- Layout contract:
  - Left: site title.
  - Center: links to landing sections (`#hero`, `#capabilities`, `#testimonials`, `#join`).
  - Right: register CTA, GitHub repository link with stars counter, and language dropdown.
- Language selector uses `shadcn` `dropdown-menu` for locale switching (`en`, `es`).
- GitHub stars are served from `GET /api/github/stars` and auto-refresh on client every minute.
- Optional `GITHUB_TOKEN` can be configured in `.env` to avoid low unauthenticated GitHub API limits.

## High-Level Architecture

- This app serves UI and backend endpoints.
- Domain logic lives in reusable server modules (not in UI components).
- Background jobs can move to a worker service when needed (imports, reminders, analytics).
- `redis` decouples write-heavy and time-based operations.
- `turso` stores canonical relational data.

## MVP Roadmap (Proposed)

### Phase 0: Foundation

- CI and quality gates (`lint`, `typecheck`, `test`)
- Auth, user profile, i18n foundation (`en`/`es`)
- IGDB ingestion pipeline (core entities)

### Phase 1: Core backlog

- Biblioteca states (`planned`, `playing`, `completed`, `dropped`, `on_hold`)
- Ratings and short reviews
- Search/filter/sort biblioteca
- Basic public profile pages (SEO-ready)

### Phase 2: Social first

- Friends (followers model) + activity feed
- Profiles and social interactions (follow/unfollow, reactions)
- Streaks/goals v1

### Phase 3: Productivity

- "What to play next" scoring v1 (rule-based)
- Backlog total hours estimation
- Backlog prioritization signals

### Phase 4: Premium + growth

- Smart recommendations (Premium, AI later phase)
- Ad system for free users
- Reminder calendar for upcoming releases
- Steam import hardening and onboarding funnels

## SEO Strategy (Critical)

- Server-rendered public pages for games, profiles, reviews, lists
- Structured metadata (Open Graph, Twitter, JSON-LD)
- Programmatic SEO pages for genres/platforms/release windows
- Localized URLs and `hreflang` (`/en/...`, `/es/...`)
- Sitemap segmentation + canonical rules
- Performance budgets (Core Web Vitals in CI)

## Internationalization

- UI copy and metadata in English and Spanish from day one
- Locale-aware slugs where possible
- Translation keys live in `src/lib/i18n`
- All new UI changes require both locales before merge

## Monetization Model

- Free tier with ads (Google AdSense at launch)
- Direct sponsorship placements if inbound advertiser demand appears
- Premium subscription:
  - Ad-free experience
  - Advanced AI recommendations
  - Future premium analytics and personalization modules

## Open Source Principles

- Contributor-first docs and predictable architecture boundaries
- Public roadmap and RFC process for major changes
- Strong automated checks to keep quality consistent

## Local Development (target workflow)

```bash
pnpm install
pnpm dev
```

Main scripts:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Authentication (Better Auth)

Authentication is implemented with Better Auth on Next.js App Router:

- API: `/api/auth/[...all]`
- Auth pages:
  - `/{locale}/login`
  - `/{locale}/register`
  - `/{locale}/forgot-password`
  - `/{locale}/reset-password`
- Supported locales: `en`, `es`
- Sign-in methods:
  - email + password
  - Google OAuth (optional, requires env vars)
  - GitHub OAuth (optional, requires env vars)
- Security flows:
  - email verification required before credential sign-in
  - verification email re-send endpoint
  - password reset via secure token email links

Required auth environment variables:

- `BETTER_AUTH_SECRET` (required in production)
- `BETTER_AUTH_URL` (optional; defaults to `NEXT_PUBLIC_APP_BASE_URL`)

Optional social auth environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

OAuth callback URLs for local development:

- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/github`

## Database (Turso + Drizzle)

Current schema includes authentication and product tables:

- `pre_registrations`
- `games`
- `user`
- `session`
- `account`
- `verification`

Setup flow:

```bash
# 1) Create database in Turso (if not created yet)
turso db create openbacklog

# 2) Get connection values
turso db show openbacklog --url
turso db tokens create openbacklog

# 3) Put them into .env
# TURSO_DATABASE_URL=libsql://...
# TURSO_AUTH_TOKEN=...
# BETTER_AUTH_SECRET=...
# BETTER_AUTH_URL=http://localhost:3000
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL=OpenBacklog <hello@updates.openbacklog.app>
# PRODUCT_ADMIN_EMAIL=admin@openbacklog.app
# IGDB_CLIENT_ID=...
# IGDB_CLIENT_SECRET=...

# 4) Generate and run migrations
pnpm db:generate
pnpm db:migrate
```

## Product Emails

Required env vars:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PRODUCT_ADMIN_EMAIL`
- `ROADMAP_SUGGESTIONS_ADMIN_EMAIL` (optional, falls back to `PRODUCT_ADMIN_EMAIL`)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional, enables GA4)
- `GOOGLE_SITE_VERIFICATION` (optional, enables GSC verification meta tag)

Current email flows include:

- Auth security emails (verification and reset password)
- Roadmap suggestion user confirmations and admin notifications

## Google Analytics + Search Console (Prepared)

The app is already wired for both integrations:

- GA4 script auto-loads if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
- Search Console verification meta tag is added if `GOOGLE_SITE_VERIFICATION` is set.
- `robots.txt` and `sitemap.xml` are available for indexing.

Once you share the IDs/tokens, just set them in environment variables and redeploy.

## Changelog entries (Markdown)

The changelog page reads markdown files from:

- `content/changelog/en/*.md` (primary source)
- `content/changelog/es/*.md` (optional)

If a locale has no markdown entries (for example `/es`), the page automatically falls back to English content.

Recommended frontmatter:

```md
---
version: 0.0.2
date: 2026-04-09
title: "v0.0.2 - Short release title"
summary: "One-line summary for cards and previews."
---
```

Files are sorted by `date` (desc) and then `version` (desc).

## Current Status

This repository is currently in project bootstrap stage.

## License

Licensed under Apache-2.0. See [LICENSE](./LICENSE).

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.

## Code of Conduct

Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).  
