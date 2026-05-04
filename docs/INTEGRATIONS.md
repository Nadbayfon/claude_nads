# External integrations

## Inbound email (per-planner OAuth)

Each planner connects their own mailbox so AI-drafted replies appear in
their personal sent folder. Couples receive replies from Jennifer's own
address, not a shared inbox.

### Gmail (Google Workspace)

- OAuth scopes (least privilege):
  - `https://www.googleapis.com/auth/gmail.readonly` — read incoming mail
    on watched labels.
  - `https://www.googleapis.com/auth/gmail.compose` — create drafts in
    the planner's account.
  - `https://www.googleapis.com/auth/gmail.send` — send (only after
    planner approves the draft).
- Watch a label (`Crystal Events / AI Watch`) rather than the entire
  inbox. Planner sets the label up once.
- Push notifications via Pub/Sub topic + Gmail watch (24h renewal cron).

### Microsoft 365

- OAuth scopes: `Mail.Read`, `Mail.ReadWrite`, `Mail.Send` (delegated).
- Subscription via Microsoft Graph webhooks; renewal cron at 48h.

### Inbound mail to `ai@crystalevents.eu`

For the "BCC the AI" / "forward to the AI" flow: a Resend or Postmark
inbound webhook receives mail addressed to the alias, looks up the
sender in `team_member.email`, and posts into that planner's
`agent_conversation` (front=`email`).

### Drafting outbound

- AI calls `compose_email_draft` tool → writes a draft into the
  planner's own mailbox.
- Planner reviews in their email client (Gmail, Outlook, etc.).
- They send manually, or click "send draft" in the in-app panel which
  invokes `gmail.send` / `Mail.Send`.

### Token storage

- `mailbox_connection.oauth_tokens` is an encrypted jsonb column
  (`pgcrypto pgp_sym_encrypt`, key in Supabase Vault).
- Refresh tokens rotated automatically on every use.
- Daily health-check cron pings each connection; failures flip
  `status='needs_reconnect'` and notify the planner via in-app and
  WhatsApp.

## Calendar sync (Phase 6.5)

Bidirectional sync per planner. Same OAuth pattern as mail.

- **Google Calendar** scope: `https://www.googleapis.com/auth/calendar`.
- **MS Calendar** scope: `Calendars.ReadWrite`.

When the AI calls `schedule_calendar_event`:

1. Tool inserts the event in the planner's primary calendar.
2. If the event is linked to a `wedding_project`, an opaque
   `extendedProperties.private.crystal_wedding_project_id` is set.
3. The reverse webhook (Google push notifications / Graph subscriptions)
   updates Crystal Events when planners edit the event in their calendar.

Conflict resolution: workspace is the source of truth for wedding-day
timeline blocks; the calendar is the source of truth for personal
working slots (planner availability).

## WhatsApp Business

See `docs/WHATSAPP.md` for the full integration spec. One verified
business number for all of Crystal Events; sender classification routes
inbound by phone identity.

## Voice transcription (Whisper)

Planners send voice notes in three places:

- WhatsApp inbound (audio attachment).
- Email attachment (mp3, m4a, ogg).
- Drag-and-drop into the in-app chat panel.

Pipeline:

1. File lands in Supabase Storage (`voice-notes/<uuid>.{ext}`).
2. Background job calls Whisper with `language=` set from the planner's
   default (Jennifer: `en`; Núria/Jackie: `ca`/`es`/`en` auto-detect).
3. Transcript becomes the body of the `agent_message` (role=`planner`).
4. The original audio remains in Storage and is purged 90 days post-wedding.

## FX rates

Daily refresh from `https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,AED,SAR,INR`.
Snapshot stored in `currency_fx_snapshot`. Budget line items reference a
specific snapshot id so historical exports are reproducible.

## Inbound webhook security

| Endpoint | Verification |
|---|---|
| `/api/whatsapp/inbound` | Meta `X-Hub-Signature-256` HMAC-SHA256 with app secret |
| `/api/email/inbound` | Resend / Postmark signature header + per-planner DKIM check |
| `/api/calendar/google` | Bearer channel token from Google Pub/Sub |
| `/api/calendar/m365` | `clientState` value matched per subscription |

All four endpoints reject any unsigned payload with 401 and log a hashed
representation for debugging.

## What we don't integrate (v1)

- Telegram, Slack, SMS — not used by the team currently.
- DocuSign / HelloSign — contracts stay manual until v1.1.
- Accounting (Quaderno / Holded) — exports are XLSX in v1.
- Couple portal — couples don't need a login in v1.
