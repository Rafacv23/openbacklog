# Server Domain Layer

Keep domain and backend logic here (`src/server`) and out of UI components.

Current scaffold:

- `auth/`: Better Auth server configuration and session helpers
- `db/`: database schema and Turso/Drizzle client setup
- `games/`: game domain services (search, sync, caching)
- `igdb/`: IGDB API integration (auth + fetch client)
- `productivity/`: rules-based recommendation, backlog scoring, risk, and planning services
- `system/`: internal service modules (health, diagnostics)
