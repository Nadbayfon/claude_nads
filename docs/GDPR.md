# GDPR & data protection

Crystal Events is the **data controller** for couple, guest and
provider personal data. Sub-processors process data on our behalf.

## Lawful bases

| Data | Basis |
|---|---|
| Couple PII (name, contact, passport for visa, IBAN for refunds) | Performance of contract |
| Guest PII (name, dietary, accommodation) | Performance of contract (with the couple), legitimate interest |
| Provider PII (contact, CV / portfolio) | Legitimate interest |
| Comm logs of WhatsApp / email | Legitimate interest + couple disclosure at onboarding |
| Photo / video material | Explicit consent (`photo_consent_level`) |
| AI processing | Performance of contract (couples disclosed at onboarding); legitimate interest (internal team comms) |

## Data map

| Category | Examples | Where it lives | Sensitive? | Retention |
|---|---|---|---|---|
| Couple identity | name, email, phone, nationality | `couple` (some encrypted) | Yes | until 30 days post-wedding, then anonymised |
| Couple finance | IBAN, payment proofs | `couple` (encrypted), Storage | High | 6 years (Spanish tax) — encrypted |
| Couple travel | passport scans | Storage | High | 30 days post-wedding then deleted |
| Guest list | name, dietary, table | `guest` (surname encrypted) | Medium | 30 days post-wedding then anonymised |
| Provider | name, contact, CV | `provider` | Low | indefinite (legitimate interest) |
| Comm logs | email/WhatsApp text | `comm_log`, `whatsapp_message` | Medium | 30 days post-wedding, then bodies purged, audit metadata kept |
| AI conversation | `agent_message` | DB | Medium | 30 days post-wedding (per wedding); planner-private chats unattached to any wedding kept 90 days from last activity |
| AI runs | `ai_run` | DB | Low | 13 months (cost analysis) |
| OAuth tokens | mailbox, calendar | encrypted | High | until planner disconnects |

## Sub-processors

| Sub-processor | Purpose | Region | DPA |
|---|---|---|---|
| Anthropic PBC | LLM API | US (with EU residency on request) | Yes; zero-retention header set on PII payloads |
| Supabase | Postgres + Auth + Storage | EU (Frankfurt or Dublin) | Yes |
| Vercel | Hosting | EU edge + US control plane | Yes; EU functions configured |
| Resend or Postmark | Inbound email | EU | Yes |
| Meta Platforms (WhatsApp Cloud) | WhatsApp Business | EU | Yes (and Meta Business Verification) |
| Google (Workspace API) | Gmail + Calendar OAuth | EU | Per planner's own GWS DPA |
| Microsoft (Graph) | M365 OAuth | EU | Per planner's own M365 DPA |
| OpenAI (Whisper) or alternative | Voice transcription | EU if available; otherwise US with zero-retention | Yes |
| frankfurter.app | FX rates | non-personal | n/a |

If Anthropic / OpenAI EU residency is unavailable, the zero-retention
setting + DPA is the compensating control. Documented in DPIA.

## DPIA highlights

- **Risk**: AI-generated provider-facing output leaks couple PII.
  **Mitigation**: post-generation regex scan against
  `couple.surnames_confidential` and budget figures; CI gate on the
  eval suite.
- **Risk**: cross-planner privacy leak via Master AI shared context.
  **Mitigation**: per-planner private conversations; explicit
  promote-to-team flow; RLS + dialog evals.
- **Risk**: WhatsApp message bodies handled by Meta US data centres.
  **Mitigation**: documented in couple onboarding; Meta DPA in place;
  bodies purged 30 days post-wedding.
- **Risk**: Anthropic prompt-cached system prompt contains organisation
  context but no couple PII.
  **Mitigation**: `prompts/00-context-company.md` deliberately contains
  no couple-specific data; reviewed at every PR touching it.

## Subject rights

- **Access**: planner generates a per-couple data export from the
  workspace (`/couples/<id>/export-personal-data`) — JSON + Storage URLs.
- **Rectification**: edit in-app.
- **Erasure**: planner triggers; cascading job deletes encrypted columns
  and Storage objects, sets `deleted_at`, hashes audit references.
- **Portability**: same as access export.
- **Objection / restriction**: handled manually by Jennifer.

Standard SLA: respond within 7 days, fulfil within 30.

## Anthropic zero-retention

Set `anthropic-version: 2023-06-01` and the appropriate retention header
on every API call carrying PII. CI test inspects every code path that
calls the Anthropic SDK and asserts the header is set whenever the
input `mayContainPII` flag is true (PDFs, contracts, raw comm bodies).

## Breach plan

1. Detect (Sentry alert / external report).
2. Contain (rotate keys, revoke tokens, isolate suspected data).
3. Assess severity within 24h.
4. Notify AEPD (Spanish DPA) within 72h if reportable.
5. Notify affected subjects without undue delay.
6. Post-mortem in `docs/RUNBOOK.md` archive.

Owner: Jennifer May. Backup contact: Núria Font.
