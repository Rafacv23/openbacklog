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

- Game tracking and personal library (Backlog-style)
- Ratings and reviews (Steam-like model)
- Time-to-beat tracking (HTLB-style integration)
- Friends + activity feed
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

- Library states (`planned`, `playing`, `completed`, `dropped`, `on_hold`)
- Ratings and short reviews
- Search/filter/sort library
- Basic public profile pages (SEO-ready)

### Phase 2: Social first

- Friends + activity feed
- Profiles and social interactions (follow/friend, reactions)
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
bun install
bun run dev
```

Expected scripts once scaffolded:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build`

## Current Status

This repository is currently in project bootstrap stage.

## License

Licensed under Apache-2.0. See [LICENSE](./LICENSE).

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening pull requests.

## Code of Conduct

Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).  
