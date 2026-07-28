# Backend task: build the Laravel API (`backend/`)

Read `PROJECT_OVERVIEW.md` first. This file is your complete spec for the Laravel side — you should not need to touch `client/`.

Laravel is already scaffolded at `backend/` (Laravel 13, PHP 8.3, `.env` configured for MySQL `zeronix_solutions`). Installed via composer: `laravel/sanctum`, `spatie/browsershot`, `setasign/fpdi`, `setasign/fpdf`. `puppeteer` is installed in `backend/node_modules` (npm) for Browsershot to drive. Sanctum's config/migrations are already published (`config/sanctum.php`, a `personal_access_tokens` migration exists in `database/migrations/`).

Old Node source to port logic from (read-only, do not edit):
- `server/src/db.ts` — table schemas (SQLite dialect; translate to MySQL types).
- `server/src/types.ts` — TS types for Block/Quote/Client/CatalogItem/Company — the JSON shape of `blocks`.
- `server/src/quoteNumber.ts` — quote number generation.
- `server/src/defaultTemplate.ts` — default blocks seeded into a new quote.
- `server/src/theme.ts`, `server/src/fonts.ts` — color/font constants used by the renderer.
- `server/src/renderQuoteHtml.ts` — the HTML/CSS quote renderer (this is the big one — port it faithfully, it's ~550 lines of self-contained string building, no exotic dependencies).
- `server/src/routes/*.ts` — the current Express route handlers (company, clients, catalog, quotes, pdf) — port their exact behavior.
- `client/src/lib/priceMath.ts` — `computeTotals(rows, vatPercent)` — subtotal/VAT/grand total math, needed both for PDF rendering and for the new stored total columns.
- `client/src/lib/types.ts` — has the canonical `Block` union type incl. `PriceRow`.

## 1. Migrations

Create migrations for:
- `companies` — singleton row `id=1` (use a check or just always query/update id=1). Columns: name, address, trn, phone, email, logo_data_url (longtext — these are base64 data URLs, can be large), logo_dark_data_url (longtext), default_payment_terms (text), default_terms (text), default_signatory (string).
- `clients` — name, company, address, phone, email, timestamps.
- `catalog_items` — description, scope, unit (string, default '1'), unit_price (decimal 12,2), timestamps.
- `quotes` — quote_no (string, unique), quote_date (date), due_date (date, nullable), client_id (foreignId nullable, `nullOnDelete`), status (string enum: draft/sent/accepted, default draft), title (string), blocks (json), **new**: subtotal_amount, vat_amount, grand_total_amount (decimal 12,2, default 0 — computed server-side, see §3), timestamps.
- `enquiries` — enquiry_no (string, unique), client_id (foreignId nullable, `nullOnDelete`), contact_name, contact_email (nullable), contact_phone (nullable), company_name (nullable), service_type (string — one of: Networking, Cloud, Cybersecurity, Software Development, IT Support & Maintenance, Hardware Supply, CCTV & Surveillance, Other), title (string), scope_of_work (longtext — Tiptap HTML), budget_range (string, nullable), priority (string enum: low/medium/high, default medium), source (string enum: website/referral/call/email/walkin/other, default other), status (string enum: new/in_review/quoted/won/lost/on_hold, default new), converted_quote_id (foreignId nullable → quotes, `nullOnDelete`), notes (text, nullable), timestamps.

Leave Laravel's default `users`, `cache`, `jobs`, `sessions`(if needed), `personal_access_tokens` migrations as-is.

Seed the singleton company row via a migration `after up` insert or a dedicated seeder (see §7) — use the same defaults currently in `server/src/db.ts` (Zeronix Technology LLC / Dubai address / TRN / phone / email / default payment terms / signatory "ISMAIL THASRIF KM") so the app isn't blank before the SQLite import runs.

## 2. Models

`Company`, `Client`, `CatalogItem`, `Quote`, `Enquiry`, standard `User`.

- `Quote`: cast `blocks` to `array`; cast money columns to `decimal:2`; `belongsTo(Client::class)`.
- `Enquiry`: cast nothing special beyond normal; `belongsTo(Client::class)`; `belongsTo(Quote::class, 'converted_quote_id')` as `convertedQuote()`.
- `Company`: no need for a full CRUD model necessarily, but a normal Eloquent model is fine — just always operate on `id=1`.

## 3. Services (`app/Services/`)

- `QuoteNumberGenerator::next(): string` — port `server/src/quoteNumber.ts` (prefix `ZN-QT-{year}-`, look up the highest existing number for the current year, zero-pad to 6 digits). Wrap the read+insert in a `DB::transaction()` with `lockForUpdate()` on the query to avoid duplicate numbers under concurrent requests.
- `EnquiryNumberGenerator::next(): string` — same pattern, prefix `ENQ-{year}-`.
- `QuoteTotalsService::compute(array $blocks): array` — port `client/src/lib/priceMath.ts::computeTotals`. Find the `pricetable` block(s) in `$blocks` (type === 'pricetable'), sum `unit * unitPrice` across all rows in all pricetable blocks found for subtotal, apply the (first pricetable block's) `vatPercent` for VAT, return `['subtotal' => ..., 'vat' => ..., 'grand_total' => ...]`. Call this whenever a quote is created/updated and persist into the `subtotal_amount`/`vat_amount`/`grand_total_amount` columns — easiest place is a `saving` Eloquent model event on `Quote`, or explicitly in the controller before save (either is fine, pick one and be consistent).
- `DefaultQuoteTemplate::buildDefaultBlocks(): array` — port `server/src/defaultTemplate.ts` verbatim (read that file for the exact block content/order).
- `QuoteHtmlRenderer` — port `server/src/renderQuoteHtml.ts` + `theme.ts` + `fonts.ts` into a PHP class with equivalent public methods:
  - `splitCoverFromBlocks(array $blocks): array` → `['cover' => ?array, 'rest' => array]`
  - `renderCoverHtml(array $cover, array $quote, array $company): string`
  - `renderContentHtml(array $blocks, array $quote, array $company): string`
  - `renderHeaderTemplate(array $company, array $quote): string`
  - `renderFooterTemplate(array $company): string`
  - `renderQuoteHtml(array $quote, array $company): string` (combined preview doc)
  - Keep the `amountInWords()`, `money()` (use `number_format`), `esc()` (use `htmlspecialchars`), and the SVG watermark/splash/noise data-URI generators as private helpers, ported 1:1. Keep the same CSS (colors from `theme.ts`, `CONTENT_PAGE_MARGIN` constant, Puppeteer-style header/footer `<span class="pageNumber">`/`<span class="totalPages">` markup — Browsershot supports these via `->showBrowserHeaderAndFooter()->headerHtml()->footerHtml()`, same as Puppeteer does, since Browsershot wraps Puppeteer's `page.pdf()` options directly).

## 4. Controllers (`app/Http/Controllers/Api/`)

Match the existing Express behavior (`server/src/routes/*.ts`) field-for-field:

- `AuthController`: `POST /login` (validates against the seeded admin user via `Auth::attempt`, regenerates session), `POST /logout`, `GET /me` (current user or 401).
- `CompanyController`: `GET /company`, `PUT /company` (always operates on id=1, same field list as `server/src/routes/company.ts`).
- `ClientController`: `GET /clients?q=`, `POST /clients`, `PUT /clients/{id}`, `DELETE /clients/{id}` — mirror `server/src/routes/clients.ts` (name required, others default to '').
- `CatalogController`: `GET /catalog`, `POST /catalog`, `PUT /catalog/{id}`, `DELETE /catalog/{id}` — mirror `server/src/routes/catalog.ts`.
- `QuoteController`: `GET /quotes?q=` (search title/quote_no/client name, left-join client for `client_name`, order by updated_at desc), `GET /quotes/{id}`, `POST /quotes` (body: title, client_id, fromTemplate — uses `QuoteNumberGenerator` + `DefaultQuoteTemplate` unless `fromTemplate === false`), `PUT /quotes/{id}` (partial update, recompute totals via `QuoteTotalsService` when `blocks` present), `DELETE /quotes/{id}`, `POST /quotes/{id}/duplicate` (new quote_no, title + " (Copy)", copies blocks/client_id, status reset to draft) — mirror `server/src/routes/quotes.ts` exactly.
- `QuotePdfController`: `GET /quotes/{id}/html` (returns `renderQuoteHtml` output as `text/html`), `GET /quotes/{id}/pdf`:
  1. Load quote + company, `splitCoverFromBlocks`.
  2. Render content HTML, run through Browsershot with margins = `CONTENT_PAGE_MARGIN`, `->showBrowserHeaderAndFooter()`, header/footer HTML from the renderer, `->format('A4')`, get PDF bytes.
  3. If a cover block exists: render cover HTML, run through Browsershot with zero margin and no header/footer, get PDF bytes; merge cover PDF + content PDF using `setasign/fpdi` (`Fpdi::setSourceFile()` + `importPage()`/`useTemplate()` per page, or `AddPage` + template import — see FPDI docs for "concatenate two PDFs" recipe), output merged bytes.
  4. Otherwise just return the content PDF bytes.
  5. Respond `application/pdf` with `Content-Disposition: attachment; filename="{quote_no}.pdf"`.
  - **Browsershot setup note**: point it at the Node/puppeteer already installed in `backend/node_modules` — e.g. `Browsershot::html($html)->setNodeModulePath(base_path('node_modules'))->noSandbox()` (headless Chrome under WAMP/Windows may need `->noSandbox()` and possibly an explicit `->setChromePath()` if Browsershot can't auto-locate the Chromium puppeteer downloaded — check `backend/node_modules/puppeteer/.local-chromium` or run a quick throwaway test PDF to confirm before wiring the real controller).
- `EnquiryController`: `GET /enquiries?q=&status=`, `GET /enquiries/{id}`, `POST /enquiries` (validate contact_name or company_name present, generate enquiry_no via `EnquiryNumberGenerator`), `PUT /enquiries/{id}`, `DELETE /enquiries/{id}`, `POST /enquiries/{id}/convert-to-quote`:
  - Create a new `Quote` via `QuoteNumberGenerator` + blocks = `DefaultQuoteTemplate::buildDefaultBlocks()` but replace/prepend a heading + richtext block using the enquiry's `title`/`scope_of_work` (e.g. a heading block "Scope of Work" + a richtext block with the enquiry's HTML), `client_id` from the enquiry if set, title = enquiry title.
  - Set the enquiry's `converted_quote_id` and `status = 'quoted'`.
  - Return the created quote (so the frontend can redirect to `/quotes/{id}`).
- `DashboardController`: `GET /dashboard/stats` — return JSON with:
  - `quotes_total`, `quotes_by_status` (draft/sent/accepted counts),
  - `accepted_value_total` (sum of `grand_total_amount` where status=accepted),
  - `enquiries_total`, `enquiries_by_status`,
  - `conversion_rate` (enquiries with status in [quoted, won] / enquiries_total, or converted_quote_id not null / total — pick a sensible definition and note it in a code comment... actually per project style, no comment needed if the field name is clear, just be consistent),
  - `monthly_trend`: last 12 months, each `{ month: 'YYYY-MM', quotes_created: n, quotes_accepted: n }` (accepted = updated_at in that month AND status=accepted — approximate is fine, this is a small internal tool).

## 5. Routes (`routes/api.php`)

```
POST   /api/login                (guest)
POST   /api/logout                (auth:sanctum)
GET    /api/me                    (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    company, clients, catalog, quotes (+duplicate, +html, +pdf), enquiries (+convert-to-quote), dashboard/stats
});
```
`/sanctum/csrf-cookie` is provided automatically by the Sanctum service provider — just make sure `EnsureFrontendRequestsAreStateful` middleware is registered for the `api` group (Laravel 13's `bootstrap/app.php` `->withMiddleware()` — add it there).

## 6. CORS (`config/cors.php`)

`'paths' => ['api/*', 'sanctum/csrf-cookie']`, `'allowed_origins' => ['http://localhost:5174']`, `'supports_credentials' => true`.

## 7. Seeder + data import

- `database/seeders/AdminUserSeeder.php` — `firstOrCreate(['email' => env('ADMIN_EMAIL')], ['name' => env('ADMIN_NAME', 'Admin'), 'password' => Hash::make(env('ADMIN_PASSWORD'))])`. Call it from `DatabaseSeeder::run()`.
- Artisan command `app:import-sqlite {path=../server/data/zeronix.db}` (`app/Console/Commands/ImportSqliteData.php`): open the SQLite file directly with `new PDO('sqlite:' . $path)` (no Laravel DB connection config needed, just raw PDO), read `company`, `clients`, `catalog_items`, `quotes` tables, and insert/upsert into the MySQL tables via Eloquent (update company id=1 in place; insert clients/catalog_items/quotes preserving their old IDs if convenient, or let MySQL auto-assign new IDs — old IDs don't matter since nothing outside this DB references them). After inserting each quote, recompute and store totals via `QuoteTotalsService`. Print a summary count of rows imported per table.

## Verification (do this yourself before handing back)

1. `php artisan migrate` runs clean against the empty `zeronix_solutions` MySQL DB.
2. `php artisan db:seed` creates the admin user.
3. `php artisan app:import-sqlite` successfully imports `server/data/zeronix.db` (check row counts).
4. `php artisan serve --port=8000`, then use `curl` (with a cookie jar, hitting `/sanctum/csrf-cookie` then `/api/login`) to confirm: login works, `GET /api/quotes` returns data, `GET /api/quotes/{id}/pdf` returns a valid PDF (check the response starts with `%PDF-`), `GET /api/dashboard/stats` returns sensible numbers.
5. Report back: what you built, any deviations from this spec and why, and the exact `curl` commands you used to verify (so they can be re-run).
