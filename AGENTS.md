# AGENTS.md

Operational guide for contributors and coding agents working on `openbacklog.app`.

## Mission

Build an open-source platform that helps players **finish more games**, not only track them.

## Product Priorities

1. Backlog productivity over vanity features.
2. Low-friction data entry and automation.
3. Social layer first in MVP (feed and friend interactions) before AI modules.
4. SEO-ready public content from early stages.
5. Scalable architecture for web now, mobile next.
6. Bilingual support (`en`, `es`) as baseline quality.

## Architectural Rules

- Keep domain logic in `src/server`, not in UI components.
- Use Next.js backend for MVP (Route Handlers + server services).
- Keep async, scheduled, and heavy workloads in a dedicated worker service once needed.
- Treat Turso as source of truth; Redis is acceleration, not canonical state.
- Design API contracts mobile-ready from day one.
- Prefer additive schema evolution via migrations only.
- Authentication standard: Better Auth.
- Email delivery standard: Resend.

## Engineering Standards

- Language: TypeScript end-to-end.
- Runtime: Node.js.
- Package manager: pnpm.
- Transactional email provider: Resend.
- Email templates: React Email.
- Testing baseline:
  - Unit tests for domain services.
  - Integration tests for API endpoints.
  - Smoke E2E for critical user journeys.
- Quality gates before merge:
  - `lint`, `typecheck`, `test` must pass.
- No secrets in repo. Use `.env.example` and secret manager in deployments.

## Domain Conventions (v1)

Library states must use a stable enum:

- `planned`
- `playing`
- `completed`
- `dropped`
- `on_hold`

Core entities expected in first milestones:

- `User`
- `Game`
- `LibraryEntry`
- `Review`
- `Friendship`
- `ActivityEvent`
- `ReleaseReminder`
- `Recommendation`

## SEO and Content Rules

- Any public page must define metadata and canonical URL.
- Add JSON-LD where applicable (games, reviews, profiles).
- Keep route design locale-aware (`/en`, `/es`).
- Avoid client-only rendering for indexable content.

## i18n Rules

- New UI text requires `en` and `es` keys in same PR.
- Never hardcode user-facing strings in components.
- Error messages returned by API should be localizable.

## Performance and Scalability Rules

- Read-heavy paths: cache with explicit invalidation policy.
- External API calls (IGDB/Steam): wrap with retry/backoff + observability.
- Use background jobs for:
  - library imports
  - release reminder scheduling
  - recommendation recomputation (later phase)
- Define SLO targets before growth features.

## Security and Abuse Controls

- Add per-IP and per-user rate limits to write endpoints.
- Moderate user-generated text (reviews/comments/feed posts).
- Validate and sanitize all external payloads.
- Keep audit logs for auth and moderation actions.

## Contribution Workflow

1. Open issue with scope and acceptance criteria.
2. Create branch with focused change set.
3. Include tests and docs update when behavior changes.
4. Open PR with:
   - what changed
   - why
   - screenshots (if UI)
   - migration notes (if schema changes)
5. Require at least one review before merge.

## Agent Workflow Expectations

- Read this file and `README.md` before making changes.
- Do not introduce new dependencies without justification.
- Keep changes minimal and scoped to requested outcome.
- If assumptions are required, state them explicitly in PR/summary.
- Prefer predictable, maintainable solutions over novelty.

## Definition of Done

A task is done when:

- Behavior matches acceptance criteria.
- Tests and quality checks pass.
- SEO/i18n implications are handled.
- Documentation is updated for operational impact.
- No critical observability/security gaps are introduced.

## Initial Open Decisions (Owner Input Needed)

1. Trigger criteria to split backend from Next.js into a dedicated API service.
