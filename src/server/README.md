# Server Domain Layer

Keep domain and backend logic here (`src/server`) and out of UI components.

Current scaffold:

- `auth/`: authentication provider baseline (`better-auth` standard)
- `db/`: database schema and Turso/Drizzle client setup
- `system/`: internal service modules (health, diagnostics)
