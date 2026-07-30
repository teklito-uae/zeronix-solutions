# AI-Driven B2B Outreach & Email Marketing Module

## Context

Zeronix Solutions currently only handles *inbound* leads (via the `Enquiries` module) and manual quoting (`Quotes`/`Clients`). There is no way to proactively find and reach companies who might need IT infrastructure setup / ICT product supply. The goal is a new module, in the spirit of explee.org, where the user feeds in Zeronix's own services/website, and the system:

1. Researches which companies/industries are good targets and who the relevant decision-maker is (IT Head, Procurement Head, etc.).
2. Drafts and sends a personalized cold-outreach pitch.
3. Automatically follows up with a short sequence, respecting cool-off periods.
4. Tracks opens/clicks/replies and stops automatically on reply or unsubscribe.
5. Converts engaged prospects into the existing `Enquiry`/`Quote` pipeline.

**Decisions already made with the user:**
- Lead sourcing: AI web research + scraping (not a paid data API like Apollo/Hunter for v1).
- Email infra: generic SMTP (send) + IMAP (read replies/bounces) — user connects any mailbox, not Gmail API/ESP.
- Scope: standalone new module (new `outreach_*` tables), with a "Convert to Enquiry" bridge into the existing CRM flow — not a rebuild of `Client`/`Enquiry`.

**Stack confirmed by exploration:** Laravel 13 (PHP 8.3) + Eloquent + SQLite backend at `backend/`; React 19 + Vite + TS + shadcn/Tailwind frontend at `client/`; Laravel queue (`QUEUE_CONNECTION=database`) already running via `queue:listen`, but `routes/console.php` has zero `Schedule::` entries today. No email sending, no AI SDK, no IMAP package, no OAuth exist yet — all new. The legacy `server/` (Node/SQLite) directory is dead and must not be touched.

---

## 1. Data Model (new migrations + models, `outreach_` prefix)

Mirror the existing pattern in `backend/app/Models/Enquiry.php` (flat `$fillable`, simple `belongsTo`/`hasMany`, `converted_x_id` bridge column).

- **`outreach_mailboxes`** — connected SMTP/IMAP identity: `name`, `from_name`, `from_email`, `smtp_host/port/username/password(encrypted)/encryption`, `imap_host/port/username/password(encrypted)/encryption/folder`, `daily_send_cap`, `sent_today`, `sent_today_reset_at`, `warmup_stage`, `warmup_started_at`, `status` (pending_test/active/error/disabled), `last_imap_check_at`, `last_error`, `is_default`.
- **`outreach_campaigns`** — `name`, `mailbox_id`, `service_focus`, `target_industry_notes`, `status` (draft/researching/active/paused/completed), `daily_new_send_limit`, `send_window_start/end`, `send_days` (json), `unsubscribe_footer_text`.
- **`outreach_sequence_steps`** — `campaign_id`, `step_number`, `wait_days` (cool-off since previous step), `subject_template`, `body_template` (Tiptap HTML, same pattern as `Enquiry.scope_of_work`), `is_final_step`.
- **`outreach_prospects`** — the researched target company: `campaign_id`, `company_name`, `website_url`, `industry_guess`, `industry_confidence`, `research_summary`, `trigger_event` (nullable — e.g. "opening new branch"), `status` (pending_research/researched/contact_found/no_contact_found/queued/active/replied/converted/unsubscribed/bounced/stopped/rejected), `researched_at`, `research_error`, plus `converted_client_id` / `converted_enquiry_id` nullable FKs mirroring `Enquiry::converted_quote_id`.
- **`outreach_contacts`** — inferred decision-maker per prospect: `prospect_id`, `full_name`, `guessed_title`, `email`, `email_confidence`, `email_verification_status` (unverified/smtp_verified/smtp_invalid/risky/skipped), `source_notes`.
- **`outreach_sends`** — one tracked email instance: `prospect_id`, `contact_id`, `sequence_step_id`, `mailbox_id`, `subject`, `body_html`, `message_id`, `in_reply_to`, `tracking_token` (unique), `status` (scheduled/sending/sent/failed/bounced/skipped_suppressed), `scheduled_at`, `sent_at`, `failed_reason`.
- **`outreach_email_events`** — append-only: `send_id`, `event_type` (open/click/reply/bounce/unsubscribe), `occurred_at`, `metadata` (json).
- **`outreach_suppressions`** — global do-not-email list: `email` (unique), `reason` (unsubscribed/bounced_hard/manual/complaint).

---

## 2. Backend Architecture

**AI client** — no SDK exists; add a thin `App\Services\Ai\ClaudeClient` using Laravel's `Http::` facade to call the Claude Messages API directly (`ANTHROPIC_API_KEY` in `.env`). Check the `claude-api` skill for current model IDs before implementing.

**Research pipeline** (queued job chain per prospect, each idempotent so failures just set `research_error` and surface a retry button in the UI):
1. `ResearchProspectJob` — scrape prospect site via `spatie/browsershot` (already installed, reused from PDF rendering — no new scraping dependency needed) → Claude call with scraped text + our own `Company` profile/services → fills `industry_guess`, `confidence`, `trigger_event`, likely decision-maker titles.
2. `FindContactJob` — Claude guesses name/email pattern from scraped team/about content, or falls back to common patterns (flagged low-confidence) → writes `outreach_contacts`.
3. `VerifyEmailJob` — SMTP `RCPT TO` handshake check (no message sent) before any real send is allowed to queue.
4. `DraftEmailJob` — Claude fills the step-1 template with scraped personalization facts → creates the first `outreach_sends` row (`scheduled`).

**Sending** — `SendOutreachEmailJob`: pre-send checks suppression list → mailbox daily cap → campaign send window/days, then sends via Laravel's mailer built at runtime per-mailbox (`Mail::build($config)`), injecting an open-tracking pixel, rewriting links through a click-tracking redirect, and appending an unsubscribe footer. Stores `Message-ID` for threading.

**Scheduling** (all new — `routes/console.php` is currently empty):
- `outreach:dispatch-due-sends` (every 5 min) — dispatches due `scheduled` sends within the send window.
- `outreach:advance-sequences` (hourly) — checks elapsed `wait_days` since last send per active prospect, creates/drafts the next step, or marks `stopped` after the final step.
- `outreach:poll-mailboxes` (every 15 min) — see below.
- `outreach:reset-daily-caps` (daily) — resets mailbox send counters.

**IMAP polling** — add **`webklex/php-imap`** (the one new backend composer dependency; PHP's classic `imap` extension is deprecated/unavailable). `PollMailboxJob` per active mailbox: fetches new messages, matches `In-Reply-To`/`References` against stored `message_id` to attribute replies → logs a `reply` event, sets prospect `status=replied`, and **cancels all further scheduled sends for that prospect** (this is the structural stop-on-reply rule, not a toggle). Also detects bounce patterns and adds hard bounces to `outreach_suppressions`.

**Tracking routes** (public, unauthenticated — the token is the secret): `GET /api/outreach/track/open/{token}.png`, `GET /api/outreach/track/click/{token}`, `GET/POST /api/outreach/unsubscribe/{token}` (required for one-click unsubscribe compliance).

---

## 3. Frontend

New pages under `client/src/pages/`, registered in `client/src/App.tsx` alongside existing routes:

- `MailboxSettingsPage` (`/settings/mailboxes` or a tab in `SettingsPage`) — connect/test SMTP+IMAP creds.
- `CampaignsPage` (`/outreach`) — campaign list with funnel metrics (sent/opened/replied/converted) using `recharts` (already installed).
- `CampaignBuilderPage` (`/outreach/:id`) — sequence step editor (Tiptap, same as `Enquiry.scope_of_work`), send-window/day picker, research input (website + industry notes).
- `ProspectsPage` (`/outreach/:id/prospects`) — table with research status, confidence, manual add/retry actions.
- `ProspectThreadPage` (`/outreach/:id/prospects/:prospectId`) — full send/event timeline + "Convert to Enquiry" button, mirroring the existing convert-to-quote pattern in `EnquiryEditorPage`.
- `DashboardPage` — extend with a small outreach summary tile rather than a new page for v1.

New routes added to `backend/routes/api.php` under the existing `auth:sanctum` group, following the same REST pattern as `/enquiries`.

---

## 4. Phased Build Order

**Phase 1 — MVP plumbing (no AI yet).** Migrations/models; mailbox connect+test UI; campaign/sequence CRUD with manual `{{token}}` templates; manual prospect/contact entry; `SendOutreachEmailJob` with pixel/click/unsubscribe tracking; `dispatch-due-sends` + `advance-sequences` schedulers; `PollMailboxJob` reply/bounce detection with stop-on-reply. Proves the send → track → follow-up → stop loop end-to-end with a human picking targets. **(Built — see status below.)**

**Phase 2 — AI research automation.** Claude client; `ResearchProspectJob → FindContactJob → VerifyEmailJob → DraftEmailJob` chain; Browsershot scraping; SMTP verification gate; research-status UI. User now only supplies services/website + an industry hint. **(Not yet built.)**

**Phase 3 — Optimization.** Send-time/day tuning from observed opens; subject-line A/B testing; reply-sentiment classification (interested/not-interested/needs-follow-up) to suggest next action; mailbox warm-up ramp (`warmup_stage` slowly raising `daily_send_cap`). **(Not yet built.)**

---

## 5. Marketing-effectiveness defaults ("minimal emails, maximum conversion")

- **3-step sequence max**, cool-off computed in **business days** (skip weekends): Day 0 intro → +4 business days value/case-study angle → +5 business days break-up email. Configurable per campaign, not hardcoded.
- **Stop-on-reply and stop-on-unsubscribe are structural**, enforced in the pre-send check every time — never optional.
- **Escalate to a human, don't auto-escalate**: if a prospect has 3+ opens with zero replies/clicks, flag it in the UI for manual follow-up rather than sending more automated email — repeated automated nudges read as spammy.
- **Personalization from the trigger event** (e.g. "saw you're opening a new branch") is the single highest-leverage lever for reply rate — prioritize this over generic `{{company_name}}` tokens.
- **Business-hours send window only** (UAE Sun–Thu default), no weekend/midnight sends.
- **Deliverability guardrails**: document SPF/DKIM/DMARC as a prerequisite on the mailbox settings page (app can't fix DNS, only warn); plain-text-leaning HTML; a simple spam-word lint on subject/body before a campaign can go "active"; gradual send-cap ramp-up (start at 5–10/day) regardless of what the user requests, to protect domain reputation.

---

## 6. Risks to flag to the user up front

1. **Deliverability without a warmed sending domain** is the single biggest threat to this feature's value, and it's outside the app's control (DNS/reputation, not code).
2. **`webklex/php-imap`** is the one new IMAP dependency; polling frequency vs. provider throttling (Gmail/Outlook IMAP limits) will need real-world tuning.
3. **LLM cost**: 2–4 Claude calls per prospect in the research pipeline — worth showing an estimated cost before bulk research runs.
4. **Legal/compliance**: cold-emailing guessed personal work addresses carries CAN-SPAM/GDPR/UAE PDPL exposure — plan assumes a B2B legitimate-interest basis with clear sender identity and one-click unsubscribe, but the user should sanity-check current UAE PDPL guidance before going live.
5. **Tracking-pixel unreliability**: Gmail/Outlook image proxying causes false or missed "opens" — weight click-tracking and replies higher than open-rate in any engagement scoring.
6. **SMTP verification isn't foolproof**: catch-all domains and greylisting produce false positives/negatives — treat `email_verification_status` as a confidence signal, not a guarantee.

---

## Verification

- `php artisan migrate` succeeds and new tables appear in the DB. ✅ Done (ran clean against the live MySQL DB).
- A test mailbox can be connected and "send test email" round-trips (visible in a real inbox). — exercise via the Mailboxes page's "Test connection" button.
- End-to-end manual test in Phase 1: create a campaign with 1 prospect/contact, send step 1, open the tracking pixel URL manually and confirm an `open` event is logged, then send a reply from the test inbox and confirm `PollMailboxJob` detects it and halts the sequence.
- `npm run dev` to confirm new frontend routes render and existing pages (Enquiries, Quotes) are unaffected. ✅ Client typecheck and production build both pass clean.

## Status

Phase 1 (MVP) implemented in full: 8 `outreach_*` migrations/models, 4 controllers, `SendOutreachEmailJob`, `PollMailboxJob` (via `webklex/php-imap`), 4 scheduled artisan commands, and 4 new frontend pages (Mailboxes, Campaigns, Campaign builder, Prospect detail) wired into the app's nav and routing. Operational prerequisite: the Laravel scheduler needs `php artisan schedule:work` (or a system cron calling `schedule:run` every minute) actually running — it is not started by `npm run dev`. Phases 2 and 3 are not yet built.
