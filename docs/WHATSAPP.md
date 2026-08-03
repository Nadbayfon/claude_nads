# WhatsApp Business integration

Crystal Events runs **one** verified WhatsApp Business number. All
inbound messages hit the same webhook; outbound messages are sent
through the Meta Cloud API.

## Setup checklist

- [ ] Meta Business Verification for Crystal Events SLU
- [ ] WhatsApp Business Account (WABA) created
- [ ] Phone number purchased / migrated and verified
- [ ] Display name approved by Meta
- [ ] Two-factor PIN set on the number
- [ ] App configured with webhook URL `/api/whatsapp/inbound`
- [ ] Verify token + app secret in Supabase Vault
- [ ] Webhook subscribed to `messages`, `message_status`,
      `message_template_status_update`
- [ ] System user + permanent access token created
- [ ] At least 3 templates submitted and approved (see below)

## Sender classification

Every inbound message is routed using the sender's E.164 phone:

```
                inbound
                   │
                   ▼
       lookup team_member by phone_e164
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 known planner          unknown sender
        │                     │
        ▼                     ▼
 agent_message       lookup couple/provider by phone
 (front=whatsapp,    │
  owner=that          ┌────────┴────────┐
  planner)           ▼                 ▼
                  match            no match
                    │                 │
                    ▼                 ▼
               comm_log on        triage inbox;
               that wedding;       AI suggests
               AI summarises      "looks like
                                   provider X /
                                   new lead /
                                   unknown — confirm"
```

The AI **does not auto-act** on unknown numbers. Planner must confirm.

## Outbound

Inside a 24-hour service window (initiated by the recipient), free-form
messages are allowed. Outside the window, only Meta-approved templates.

### v1 templates (to submit for approval)

| Name | Category | Purpose |
|---|---|---|
| `crystal_planner_digest_v1` | UTILITY | Daily morning digest to planners (next 2h on wedding day, today's deadlines otherwise). |
| `crystal_couple_deadline_reminder_v1` | UTILITY | Soft deadline reminder to a couple (e.g. "5 days left to confirm seating"). |
| `crystal_provider_followup_v1` | UTILITY | Follow-up on an outstanding RFQ; CA and ES versions. |
| `crystal_wedding_day_briefing_v1` | UTILITY | Wedding-day morning briefing to the team on duty. |

All templates support EN, ES, CA. Outbound to unknown senders (lead
generation) is forbidden — messaging unsolicited contacts violates Meta
policy and our own GDPR posture.

### Template lifecycle

`whatsapp_template` table tracks: `name`, `language`, `category`,
`body`, `meta_status` (`pending`|`approved`|`rejected`|`paused`),
`submitted_at`, `approved_at`. The `crystal-integrations-engineer` skill
bundles the submission checklist.

## Webhook handler

`/api/whatsapp/inbound` (Next.js route handler, Node runtime):

1. Verify `X-Hub-Signature-256` against app secret. 401 on mismatch.
2. Parse webhook payload.
3. Persist raw payload to `whatsapp_message` immediately
   (`classified_as='triage'`).
4. Run sender classification.
5. Either:
   - Enqueue an `agent_runtime` turn (planner command), OR
   - Write a `comm_log` entry and notify the wedding's lead planner, OR
   - Leave in triage with an AI suggestion attached.
6. Return 200 within 5s (Meta requirement).

## Wedding-day push

At T-2h on a wedding day, a cron job:

1. Pulls each event's `timeline_block` rows in the next 2h window.
2. Builds a digest per planner on duty (events they own + their contacts).
3. Sends `crystal_wedding_day_briefing_v1` to each.

The digest contains time, section, title, contact name, contact phone.
No surnames. No couple budget figures.

## GDPR notes

- **Lawful basis**: legitimate interest for planner-team comms;
  performance-of-contract for couple comms; consent for provider
  outreach (covered by RFQ disclaimer).
- **Disclosure**: every couple onboarding mail includes "we use
  WhatsApp Business; messages are processed by Meta and stored in our
  GDPR-compliant Supabase EU database for the duration of your project +
  30 days".
- **Retention**: `whatsapp_message` rows linked to a wedding are kept
  until 30 days post-wedding, then archived (no body retained, only
  metadata for audit).
- **Right to erasure**: a couple's number can be wiped on request — the
  job removes message bodies but keeps `wa_message_id` for audit.

## Things we deliberately don't do

- We don't auto-broadcast to provider lists.
- We don't run paid Meta ads.
- We don't store voice notes in WhatsApp Cloud — they're downloaded
  immediately to Supabase Storage and the Meta media URL is discarded.
- We don't allow WhatsApp inbound from unknown numbers to trigger
  outbound messages without planner confirmation.
