# Frontend task: shadcn/ui, Dashboard analytics, Enquiries (`client/`)

Read `PROJECT_OVERVIEW.md` first. This file is your complete spec for the frontend side. A separate agent is building the Laravel API in `backend/` in parallel — don't edit anything under `backend/` or `server/`. If you need to start the frontend dev server against a live API before the backend agent finishes, that's fine — build against the contract described here and below.

Existing stack (already in `client/`, keep it): React 19, Vite 8, TypeScript, Tailwind v4 (`@tailwindcss/vite` plugin, CSS-first `@theme` config in `src/index.css` — brand colors `--color-brand-navy`, `--color-brand-black`, `--color-brand-green`, `--color-brand-green-dark`), react-router-dom v7, Tiptap (rich text), dnd-kit (drag/drop block reordering). `oxlint` for linting.

Current pages: `DashboardPage` (quote list + search + create), `QuoteEditorPage` (block-based document editor), `SettingsPage` (company profile), `CatalogPage`, `ClientsPage`. Current API client: `src/lib/api.ts` (plain `fetch` wrapper, base path `/api`, proxied by Vite to the backend). Current types: `src/lib/types.ts`.

## 1. shadcn/ui setup

Run `npx shadcn@latest init` inside `client/` — it supports Tailwind v4 + Vite + React 19 out of the box. Let it detect the existing Tailwind config; keep the existing brand color theme variables in `src/index.css`, don't let the init overwrite/remove them (check the diff before accepting; merge shadcn's own CSS variables alongside the existing `--color-brand-*` ones rather than replacing the file). Then add components via the CLI as you need them (don't hand-write shadcn primitives) — at minimum: `button card input label textarea select table badge dialog alert-dialog dropdown-menu sidebar sheet separator tabs avatar tooltip skeleton sonner form chart`.

Use shadcn's official sidebar block pattern (e.g. the CLI's `sidebar-07`-style composition) for the app shell rather than building a custom sidebar from scratch.

## 2. Auth

New `src/contexts/AuthContext.tsx` (or a `useAuth` hook): on mount, `GET /api/me`; expose `user`, `login(email, password)`, `logout()`. Sanctum SPA auth requires: before login, `GET /sanctum/csrf-cookie` (with `credentials: 'include'`), read the `XSRF-TOKEN` cookie and send it back as the `X-XSRF-TOKEN` header on state-changing requests (POST/PUT/DELETE) — either handle this in `api.ts`'s `req()` helper (read `document.cookie`, decode the `XSRF-TOKEN` value, set the header) so every existing call site keeps working unchanged, or use a small fetch-wrapping library — prefer the former, it's a small change to one function.

New `src/pages/LoginPage.tsx` (email/password form, shadcn `Card`/`Input`/`Label`/`Button`). New `ProtectedRoute` wrapper component used in `App.tsx` around all existing routes, redirecting to `/login` when unauthenticated. Root layout (sidebar) should only render once authenticated.

## 3. `src/lib/api.ts` extensions

Add (matching the backend spec in `BACKEND_TASKS.md`):
```ts
auth: { me, login(email, password), logout }
enquiries: { list(q?, status?), get(id), create(data), update(id, data), remove(id), convertToQuote(id) }
dashboard: { stats() }
```
Update the base `req()` helper for `credentials: 'include'` + CSRF header (see §2). Add corresponding types to `src/lib/types.ts`: `Enquiry` (mirror the migration field list in `BACKEND_TASKS.md` §1), `DashboardStats` (mirror the `DashboardController` response shape in `BACKEND_TASKS.md` §4).

## 4. App shell

Replace the current simple top-nav (see `DashboardPage.tsx`'s header markup, repeated per-page) with one persistent shadcn `Sidebar` layout component wrapping all authenticated routes. Nav items: Dashboard, Enquiries, Clients, Catalog, Settings. Keep it simple — this is a small internal tool, not a huge app.

## 5. Dashboard rewrite (`src/pages/DashboardPage.tsx`)

**Before writing any chart code, invoke the `dataviz` skill** — it governs chart form, color, and layout rules for this codebase.

Keep the existing behavior (search quotes, "+ New from Template" / "+ Blank Quote" buttons, quote list with duplicate/delete). Convert the raw `<table>` to shadcn `Table`, status pills to `Badge` (draft=secondary/gray, sent=amber/warning-ish, accepted=green — match existing `statusColor` mapping's intent), row actions to a `DropdownMenu`.

Add, above the table, driven by a new `api.dashboard.stats()` call:
- A responsive row of shadcn `Card` stat tiles: Total Quotes, Accepted Quotes, Sent/Pending, Draft, Total Accepted Value (AED, formatted like `formatMoney` in `src/lib/priceMath.ts`), Open Enquiries.
- Two charts: (a) quotes-by-status breakdown (donut or bar — follow the dataviz skill's guidance on which form fits 3-category data), (b) a 12-month trend of quotes created vs. accepted (line or area). Use shadcn's `chart` component (Recharts-based).

## 6. Enquiries module (new)

- `src/pages/EnquiriesPage.tsx`: shadcn `Table` list — columns: enquiry_no, title, contact (name + company), service_type, status (`Badge`), priority, created_at. A status `Select` filter and a search `Input` (same debounced-on-change pattern as the existing quote search in `DashboardPage.tsx`). A "+ New Enquiry" button.
- `src/pages/EnquiryEditorPage.tsx` (route `/enquiries/:id`, plus a `/enquiries/new` or reuse `:id === 'new'`): a form with all enquiry fields (shadcn `Input`/`Select`/`Textarea`/`Label`, a `Form` wrapper if you pull in `react-hook-form` — check if it's already a dependency before adding it, otherwise plain controlled state is fine and matches the existing codebase's style, e.g. `SettingsPage.tsx`). For `scope_of_work`, extract the Tiptap setup out of `src/blocks/RichTextBlockView.tsx` into a small reusable `src/components/RichTextEditor.tsx` (props: `html`, `onChange`) and use it here too — don't duplicate the Tiptap config.
  - Once saved (has an id), show a "Convert to Quote" button calling `api.enquiries.convertToQuote(id)` then `navigate('/quotes/' + result.id)`.
- Register `/enquiries` and `/enquiries/:id` routes in `App.tsx`; add "Enquiries" to the sidebar nav.

## 7. Restyle existing pages onto shadcn primitives

`ClientsPage.tsx`, `CatalogPage.tsx`, `SettingsPage.tsx`: swap raw `<table>`/`<input>`/`<button>`/`window.confirm` for shadcn `Table`/`Input`/`Label`/`Button`/`AlertDialog` (delete confirmation) — presentational only, don't change the data-fetching logic or field lists.

`QuoteEditorPage.tsx`: restyle the outer chrome (top toolbar, save/status controls) onto shadcn `Button`/`DropdownMenu`/`Select`. Leave `BlockEditor.tsx`, `InsertMenu.tsx`, `SortableBlock.tsx`, and the block view components (`src/blocks/*.tsx`) as-is except for swapping their buttons/inputs to shadcn equivalents where it's a direct drop-in — the dnd-kit sorting and block-editing logic itself should not change.

## 8. Vite proxy

`client/vite.config.ts`: change the `/api` proxy target from `http://localhost:4001` to `http://localhost:8000`, and add a second proxy entry for `/sanctum` → same target (needed for the CSRF cookie route).

## Verification (do this yourself before handing back)

1. `npm run dev -w client` starts clean, no TypeScript errors (`tsc -b` via `npm run build -w client` should also pass).
2. If the backend is already up on `:8000`: log in, view the dashboard (cards + charts render, even with placeholder-looking numbers), create an enquiry with rich-text scope of work, convert it to a quote, confirm it lands in the quote list.
3. If the backend isn't ready yet: at minimum confirm the app builds and routes render without runtime errors using mocked/empty API responses, and note in your report what still needs a live backend to verify.
4. Report back: what you built, any deviations from this spec and why, and screenshots/description of what the dashboard and enquiries pages look like.
