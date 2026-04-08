# Contributing to openbacklog.app

Thanks for contributing.

This project is open source and community-driven. The goal is to keep contribution flow fast, clear, and high quality while building a product that can scale.

Please also read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Before You Start

- Read [README.md](./README.md) for product context.
- Read [AGENTS.md](./AGENTS.md) for architecture and quality rules.
- Check existing issues before opening a new one.

## Ways to Contribute

- Report bugs
- Propose or refine features
- Improve documentation
- Submit code changes
- Help with tests and quality tooling

## Issue Guidelines

When opening an issue, include:

- Problem statement
- Expected behavior
- Current behavior
- Reproduction steps
- Environment details (OS, Node.js and pnpm versions)
- Screenshots/logs if relevant

For feature requests, include:

- User problem
- Proposed solution
- Scope (MVP vs future)
- Acceptance criteria

## Development Setup

```bash
pnpm install
pnpm dev
```

Run checks before submitting:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Branch and PR Workflow

1. Open or pick an issue.
2. Create a focused branch from `main`.
3. Implement the smallest complete change.
4. Add or update tests.
5. Update docs when behavior changes.
6. Open a pull request.

PRs should include:

- What changed
- Why it changed
- Screenshots or recording for UI work
- Migration notes for schema/data changes
- Follow-up tasks (if intentionally out of scope)

## Coding Standards

- TypeScript first.
- Keep domain logic in server modules, not UI components.
- Avoid adding dependencies unless clearly justified.
- Keep changes scoped; avoid unrelated refactors.
- Prefer readable, maintainable code over novelty.

## Testing Expectations

- Unit tests for domain logic.
- Integration tests for API behavior.
- Critical user flows covered by E2E/smoke tests.
- New behavior should have test coverage.

If a test cannot be added, explain why in the PR.

## Internationalization

- New user-facing strings must include `en` and `es`.
- Do not hardcode UI strings in components.

## SEO and Performance

For public pages:

- Include metadata and canonical handling.
- Prefer server-rendered indexable content.
- Consider Core Web Vitals impact.

## Security and Privacy

- Never commit secrets.
- Validate external input.
- Use least-privilege patterns for integrations.
- Report security issues privately (do not open public issue with exploit details).

## License

By contributing, you agree that your contributions are licensed under [Apache-2.0](./LICENSE).
