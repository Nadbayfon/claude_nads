# Architecture

## High-level diagram

```
                           ┌────────────────────────────┐
                           │  Anthropic API (cached)    │
                           │  Opus 4.7 / Sonnet 4.6 /   │
                           │  Haiku 4.5                 │
                           └────────────▲───────────────┘
                                        │
   ┌──────────────────┐                  │              ┌──────────────────────────┐
   │  In-app chat     │──────┐           │           ┌──│  Gmail / M365 inbound    │
   │  (workspace UI)  │      │           │           │  │  (per-planner OAuth)     │
   └──────────────────┘      │           │           │  └──────────────────────────┘
                             │           │           │
   ┌──────────────────┐      │   ┌───────┴───────┐   │  ┌──────────────────────────┐
   │  WhatsApp Cloud  │──────┼──▶│  agent_       │◀──┼──│  Google / MS Calendar    │
   │  (Meta)          │      │   │  runtime      │   │  │  (per-planner OAuth)     │
   └──────────────────┘      │   └───────┬───────┘   │  └──────────────────────────┘
                             │           │           │
                             │           ▼           │
                      ┌──────┴──────────────────────┴──────┐
                      │     Next.js 15 (App Router)         │
                      │     Server actions + API routes     │
                      │     Per-feature agents              │
                      │     Tool registry (packages/ai)     │
                      └──────────────────┬──────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Supabase Postgres  │
                              │  (RLS on every      │
                              │  table; pgcrypto    │
                              │  for PII columns)   │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Supabase Storage   │
                              │  (proposals, PDFs,  │
                              │  exports, voice     │
                              │  notes)             │
                              └─────────────────────┘
```

## Surfaces

1. **Workspace** — Next.js app at `app.crystalevents.eu`. Planner UI in
   English. Includes the in-app Master AI chat panel.
2. **Email-to-AI** — inbound webhook (Resend or Postmark) receives mail
   forwarded to `ai@crystalevents.eu` or BCC'd; per-planner Gmail/M365
   OAuth provides outbound drafting in the planner's own account.
3. **WhatsApp** — Meta Cloud API webhooks; one verified business number;
   inbound classified by sender phone (planner phone → private agent
   message; external phone → shared comm log).

All three surfaces hand off to a single `agent_runtime` that owns one
conversation per planner and persists every message + tool call.

## Trust boundaries

| Boundary | Notes |
|---|---|
| Planner browser ↔ Next.js | Supabase Auth session cookie; all server actions check `auth.uid()`. |
| Next.js ↔ Supabase | Anon key for planner-scoped queries (RLS does the work); service-role key only inside cron jobs and the inbound webhook handlers, never inside Master AI tools. |
| Next.js ↔ Anthropic | Server-side only. Zero-retention header on any payload that may include PII (proposals, contracts, passport text). System prompt cached. |
| Next.js ↔ Meta WhatsApp | Webhook verified via Meta signature (`X-Hub-Signature-256`); outbound only via approved templates outside session windows. |
| Next.js ↔ Gmail/M365 | OAuth tokens stored encrypted in `mailbox_connection.oauth_tokens` (pgcrypto). Daily health-check job pings each connection. |

## Data flow (Master AI on WhatsApp, worked example)

1. Jennifer texts the CE business number from her registered phone.
2. Meta webhook hits `/api/whatsapp/inbound`. Handler verifies signature,
   parses sender, looks up `team_member` by phone — finds Jennifer.
3. Inbound classified as planner command → routed into Jennifer's
   `agent_conversation` (front=`whatsapp`).
4. `agent_runtime` loads `prompts/00-context-company.md` (cached) and the
   conversation history, calls Anthropic with the tool registry available.
5. Model picks `lookup_couple` and `next_deadlines` tools. Tools execute
   under Jennifer's RLS context (her assigned weddings only).
6. Model produces a reply; runtime persists `agent_message` rows for the
   planner turn, the assistant turn, and each tool invocation; sends the
   reply via Meta API.
7. If Jennifer later opens the workspace, the same conversation is visible
   in the in-app chat panel.

## Background jobs

- **Vercel cron** + **Supabase queue** for any AI run >30s
  (proposal extraction, full timeline generation, long Master AI tool
  chains). UI / WhatsApp polls `ai_run.status`.
- **Daily** OAuth health check, FX refresh, integrity check on
  `agent_conversation` ↔ `team_member` link.
- **Wedding-day** scheduler at T-2h pushes the next-2-hours digest to the
  planner on duty via WhatsApp template.

## Observability

- **Sentry** for errors (PII scrubbed via `beforeSend`).
- **PostHog** for product analytics (PII-stripped events; no couple names,
  no provider names).
- **Supabase logs** for slow queries.
- **`ai_run`** table for per-call cost, latency, model, status; powers an
  internal "AI bill" dashboard.

## Failure modes

| Failure | Behaviour |
|---|---|
| Anthropic 5xx / timeout | `ai_run.status='failed'`; Master AI replies "I hit a hiccup, retrying"; retry with exponential backoff. |
| Meta webhook signature fail | 401, log with hashed body. |
| Gmail token revoked | Mailbox marked `inactive`; planner gets in-app + WhatsApp prompt to reconnect; email front paused for that planner only. |
| Supabase RLS denial inside a tool | Tool returns a structured "not allowed" result; AI surfaces "I can't see that wedding from your account" to the planner. |
| Inbound WhatsApp from unknown number | Lands in triage inbox; AI suggests likely match (provider X / new lead / unknown); does not auto-act. |
