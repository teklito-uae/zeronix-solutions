# Zeronix Quote Builder

Internal tool for Zeronix Technology LLC (IT services company, Dubai) to build, PDF-export, and track client quotes.

Being migrated from a Node/SQLite prototype (`server/`) to Laravel + MySQL + shadcn/ui (`backend/` + `client/`), plus a new Enquiries module and analytics dashboard.

See [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md), [BACKEND_TASKS.md](./BACKEND_TASKS.md), and [FRONTEND_TASKS.md](./FRONTEND_TASKS.md) for details.

## Repo layout

- `server/` — old Node/Express + better-sqlite3 backend (reference only, being phased out).
- `client/` — React 19 + Vite + Tailwind v4 SPA.
- `backend/` — Laravel 13 API (MySQL, Sanctum auth, Browsershot PDF rendering).
