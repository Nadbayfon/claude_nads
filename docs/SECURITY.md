# Security

## Secrets

Stored in **Supabase Vault** (production) and **Vercel Encrypted Env**
(per-environment). Never committed.

| Secret | Owner | Rotation |
|---|---|---|
| Supabase service role key | Jennifer | Annual + on suspected exposure |
| Anthropic API key | Jennifer | Annual + on suspected exposure |
| Meta WhatsApp app secret | Jennifer | Annual |
| Meta WhatsApp permanent token | System user | Annual; Meta auto-expires |
| Resend / Postmark inbound webhook secret | Jennifer | Annual |
| Google OAuth client secret | Jennifer (per planner) | Annual |
| Microsoft OAuth client secret | Jennifer (per planner) | Annual |
| Whisper API key | Jennifer | Annual |
| `pgcrypto` symmetric key | Jennifer | 2 years; re-encrypt all encrypted columns on rotation (background job) |
| Sentry DSN | Public-ish (low sensitivity) | n/a |

## Encryption at rest

- Supabase storage encrypted at rest by default.
- Sensitive columns (`couple.surnames_confidential`,
  `guest.surname_confidential`, `couple.iban`, `couple.passport_path`,
  `mailbox_connection.oauth_tokens`, `calendar_connection.oauth_tokens`)
  use `pgcrypto pgp_sym_encrypt` with the Vault key.
- Decryption only inside `SECURITY DEFINER` functions that check the
  caller's role; no SELECT on the raw cipher allowed via RLS.

## Authentication

- Supabase Auth: Google SSO (preferred) + email magic link.
- Allow-list on `auth.users.email` enforced by a trigger; only addresses
  in `team_member.email` can sign in.
- Sessions: 7 days idle, 30 days max; refresh tokens rotated.
- 2FA at the Google Workspace level (handled by the planner's GWS).

## Authorisation

- RLS on every table; default deny. See `docs/RBAC.md` for the matrix.
- Service-role key only used by:
  - Cron jobs (`/api/cron/*`)
  - Inbound webhooks (`/api/whatsapp/inbound`, `/api/email/inbound`)
  - Migrations
- Master AI tools never see the service-role key. Tool invocations
  always use the planner's session.

## Input handling

- All external inputs validated with zod at the boundary.
- File uploads scanned (size + MIME); PDFs rendered server-side via
  `pdf.js` in a sandboxed worker.
- HTML in user-supplied content stripped with `sanitize-html`.

## Webhook security

| Endpoint | Verification |
|---|---|
| `/api/whatsapp/inbound` | `X-Hub-Signature-256` HMAC against app secret |
| `/api/email/inbound` | Resend / Postmark signature header |
| `/api/calendar/google` | Google Pub/Sub channel token |
| `/api/calendar/m365` | Microsoft Graph `clientState` |

Replay protection: every accepted webhook stores a hash of the body and
rejects duplicates within a 10-minute window.

## Logging

- Sentry: errors only, with `beforeSend` scrubbing email addresses and
  any field whose name matches `/passport|iban|surname/i`.
- Supabase logs: 7-day retention default; extended to 90 days on the
  cron + webhook handlers.
- `audit_log` table: every write to `couple`, `provider`, `budget_*`,
  `coi_acknowledgement`, `agent_conversation` (share/unshare),
  `mailbox_connection` (connect/disconnect).

## Dependency hygiene

- `pnpm audit` weekly via GitHub Actions.
- Dependabot enabled.
- Locked Node version via `engines` field; pinned `pnpm` via
  `packageManager`.

## Threat model snapshot

| Threat | Mitigation |
|---|---|
| Stolen planner laptop | Short session lifetime + 2FA + remote sign-out from workspace admin. |
| Social-engineered OAuth grant on a planner's mailbox | Planner OAuth runs in their own account; revoke from Google/M365 admin. |
| Malicious PDF in Storage | Sandboxed parsing; size cap; no inline JS render. |
| Prompt injection via couple email | Planner-mediated review for all outbound; AI never auto-sends. |
| RLS bypass via mistakenly-elevated server route | Code review + CI test that scans for `service_role` usage outside `/api/cron/*` and `/api/(whatsapp|email|calendar)/inbound`. |
| Unverified WhatsApp inbound | HMAC verification; unknown numbers go to triage. |

## Penetration testing

Light external pentest before v1 launch (Phase 8). Focus on
authn/authz, RLS, and webhook signature handling.
