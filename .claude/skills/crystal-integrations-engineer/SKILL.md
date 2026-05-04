---
name: crystal-integrations-engineer
description: OAuth and webhook plumbing for Gmail, Microsoft 365, Google Calendar, MS Calendar, WhatsApp Cloud API, and Whisper transcription. Bundles scope strings, callback patterns, secret management, and Meta template approval flow. Use when adding or modifying any external integration.
---

# crystal-integrations-engineer

## When to invoke

- Adding or modifying an OAuth flow (Gmail / M365 / Google / MS).
- Implementing a webhook handler (`/api/whatsapp/inbound`, etc.).
- Submitting or updating a WhatsApp template.
- Connecting a new transcription / FX / external API.

## Reference docs

Always consult before changing anything:
- `docs/INTEGRATIONS.md` — provider list, scopes, retention.
- `docs/WHATSAPP.md` — Meta-specific rules, sender classification.
- `docs/SECURITY.md` — webhook verification, secrets.
- `docs/GDPR.md` — sub-processors, retention, DPAs.

## OAuth scopes (least privilege)

### Gmail (Google Workspace)

```
openid
email
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/gmail.send
```

Watch a label (`Crystal Events / AI Watch`), not the whole inbox.

### Microsoft 365

```
openid
email
offline_access
Mail.Read
Mail.ReadWrite
Mail.Send
```

### Google Calendar

```
https://www.googleapis.com/auth/calendar
```

### MS Calendar

```
Calendars.ReadWrite
```

## Token storage

`mailbox_connection.oauth_tokens` and
`calendar_connection.oauth_tokens` are encrypted (`pgp_sym_encrypt`),
key from Supabase Vault. Refresh tokens rotate on every use.

## Webhook handler template

`apps/web/app/api/<surface>/inbound/route.ts`:

```ts
import { verifySignature } from "@/server/integrations/<surface>/verify";
import { ingest } from "@/server/integrations/<surface>/ingest";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256") ?? "";
  if (!verifySignature(raw, sig)) {
    return new Response("invalid signature", { status: 401 });
  }

  // Persist the raw payload immediately for audit.
  const payload = JSON.parse(raw);
  const recordId = await persistRaw(payload);

  // Ack within 5 seconds; do work async.
  enqueue("ingest", { recordId, payload });
  return new Response("ok", { status: 200 });
}
```

## WhatsApp specifics

### Approved templates lifecycle

`whatsapp_template` row goes through:
`pending` → `approved` | `rejected` | `paused`.

Submitting a template:

1. Author the body in EN / ES / CA. No emojis. No promotional copy.
2. Submit via Meta Cloud API or Business Manager UI.
3. Insert row into `whatsapp_template` with `meta_status='pending'`.
4. Webhook `message_template_status_update` flips the status when
   approved/rejected. Skill lint warns when a template has been
   `pending` >7 days.

### Sender classification

```ts
async function classifyInbound(from_e164: string) {
  const planner = await db.team_member.findByPhone(from_e164);
  if (planner) return { kind: "planner_command", team_member: planner };

  const wedding = await db.findWeddingByContactPhone(from_e164);
  if (wedding) return { kind: "wedding_comm", wedding };

  return { kind: "triage", suggested_match: await suggestMatch(from_e164) };
}
```

The AI never auto-acts on `triage` results.

### Meta verification

Webhook signature check:

```ts
import crypto from "crypto";

export function verifySignature(rawBody: string, headerValue: string) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.WHATSAPP_APP_SECRET!)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(headerValue));
}
```

## Whisper

- Always download the media to Supabase Storage first; never pass a
  Meta media URL directly to Whisper (URL expires fast).
- Set `language` from the planner's profile (Jennifer: `en`;
  Núria/Jackie: auto-detect with bias to `ca`).
- Voice notes purged 90 days post-wedding (cron sweep).

## Secret management

- All secrets in Supabase Vault (prod) or Vercel encrypted env (per
  environment).
- Rotation cadence in `docs/RUNBOOK.md`.
- Never log a secret. Sentry `beforeSend` strips `oauth_tokens`,
  `app_secret`, `api_key` keys.

## Don't

- Don't use the service-role key inside a webhook handler unless
  the handler is solely about persistence (no business logic that
  shapes RLS-relevant decisions).
- Don't auto-send WhatsApp templates without planner confirmation
  (except the wedding-day digest, which has explicit prior consent
  via the planner's settings).
- Don't store OAuth tokens unencrypted, ever.
- Don't broadcast outbound to unknown numbers.
- Don't subscribe Gmail to the entire inbox; always a label-scoped
  watch.
