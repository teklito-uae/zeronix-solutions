# Zeronix Quote Builder — migration overview

Internal tool for Zeronix Technology LLC (IT services company, Dubai) to build, PDF-export, and track client quotes. Being migrated from a Node/SQLite prototype to Laravel + MySQL + shadcn/ui, plus a new Enquiries module and a real analytics dashboard.

Read this file first. Then read only the task file for whichever side you're building (`BACKEND_TASKS.md` or `FRONTEND_TASKS.md`) — don't read the other side's task file unless you need to confirm an API contract.

## Repo layout

- `server/` — **old** Node/Express + better-sqlite3 backend. Read-only reference for porting logic. Do not modify. Will be deleted later once the new stack is verified.
- `client/` — React 19 + Vite + Tailwind v4 SPA. This is being kept and evolved (not rebuilt from scratch) — restyle onto shadcn/ui, add new pages, do not throw away the existing routing/data-fetching structure.
- `backend/` — **new** Laravel 13 app (already scaffolded: `composer create-project laravel/laravel`, PHP 8.3 via WAMP, packages `laravel/sanctum`, `spatie/browsershot`, `setasign/fpdi`, `setasign/fpdf` already installed via composer; `puppeteer` npm package installed in `backend/node_modules` for Browsershot to drive). `.env` is already configured for MySQL.

## Confirmed architecture decisions

- **DB**: MySQL, database `zeronix_solutions` already created by the user in WAMP (empty). Laravel `.env` already points at it: `127.0.0.1:3306`, user `root`, no password.
- **Auth**: single-admin login via Laravel Sanctum, SPA cookie-based auth (not token bearer). Frontend origin in dev is `http://localhost:5174`; backend in dev is `http://localhost:8000` (`php artisan serve --port=8000`). `.env` already has `SANCTUM_STATEFUL_DOMAINS=localhost:5174`, `SESSION_DOMAIN=localhost`, `FRONTEND_URL=http://localhost:5174`, and seed credentials `ADMIN_EMAIL` / `ADMIN_PASSWORD` (also `ADMIN_NAME`).
- **PDF engine**: Spatie Browsershot (drives headless Chrome via the Node/puppeteer already installed in `backend/node_modules`) — NOT dompdf. This is required to preserve the existing PDF's flexbox/gradient/cover-page/watermark design and Puppeteer-specific header/footer page-number templates.
- **API shape**: Laravel is a pure JSON API under `/api/*` (no Blade views, no web UI). The React SPA is the only frontend. Keep REST endpoint paths and JSON field names matching the old Express API where practical (see `BACKEND_TASKS.md`) so the frontend port is mostly additive.
- **Vite dev proxy**: `client/vite.config.ts` proxies `/api` and `/sanctum` to `http://localhost:8000` (needs updating from the old `:4001` Node port — see `FRONTEND_TASKS.md`).

## Domain model (from the old app, being carried forward)

- **Company**: single-row company profile (name, address, TRN, phone, email, two logo data-URLs, default payment terms/terms/signatory) used on every quote PDF.
- **Client**: name, company, address, phone, email.
- **CatalogItem**: reusable line item (description, scope, unit, unit_price) that can be inserted into a quote's price table.
- **Quote**: quote_no (auto-generated `ZN-QT-{year}-{seq}`), quote_date, due_date, client_id, status (draft/sent/accepted), title, and a `blocks` JSON array describing the document body (cover, heading, richtext, table, pricetable, divider, pagebreak, signature block types — see `client/src/lib/types.ts` for the exact shape). PDF/HTML rendering walks these blocks.
- **Enquiry** (new): inbound IT-services request, can be converted into a Quote. See `BACKEND_TASKS.md` for the full field list.

## What "done" looks like

A user can: log in → log an enquiry with a rich-text scope of work → convert it to a quote → build out the quote's price table/content → preview/download a PDF that looks the same as today's → see the dashboard update its stat cards and charts to reflect quote/enquiry activity.
