# Data model

Every table includes:

```
id          bigserial primary key
public_id   uuid not null default gen_random_uuid() unique
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
created_by  uuid references auth.users(id)
```

`updated_at` is maintained by a trigger. Every table has explicit RLS
policies; the default is "deny all".

## Org / users

### `org`
Singleton for v1 (`Crystal Events`). Multi-org is post-v1.

### `team_member`
- `id`, `auth_user_id` (FK `auth.users`), `display_name`, `email`,
  `phone_e164`, `role` enum(`owner`|`planner`|`stylist`|`admin`|`external_assistant`)
- `is_active`, `coi_disclosure_acknowledged_at`
- Used to bind WhatsApp number, email address, and Supabase user to one
  identity (cross-front continuity).

### `team_member_external_provider_link`
- Links Núria → Roc 35. Drives COI banner + `coi_acknowledgement` flow.

## Couple & project

### `couple`
- `display_name` (e.g. "Sham & Shwan") — what the AI uses by default
- `surnames_confidential` (encrypted, `pgcrypto`) — never appears in
  provider-facing output
- `nationality_partner_1`, `nationality_partner_2`
- `photo_consent_level` enum(`none`|`internal`|`web`|`press`)
- `gdpr_consent_at`, `gdpr_consent_version`

### `wedding_project`
- FK `couple`, `lead_planner_id` (team_member), `secondary_planner_ids[]`
- `wedding_date`, `guest_count_estimate`, `guest_count_confirmed`
- `is_hindu_sikh` bool, `is_jewish` bool
- `status` enum(`enquiry`|`active`|`confirmed`|`delivered`|`closed`)
- `currency_reporting` (default `EUR`)

### `event` (sub-event)
- FK `wedding_project`
- `kind` enum: `welcome_dinner`|`haldi`|`mehendi`|`sangeet`|`baraat`|
  `ceremony`|`cocktail`|`reception`|`brunch`|`farewell`|`other`
- `phase` enum(`pre`|`wedding_day`|`post`)
- `date`, `start_time`, `end_time`, `venue_id` (nullable FK `provider`)

## Provider DB

### `provider`
- `legal_name`, `trade_name` (Catalan/Spanish form used locally)
- `category` enum: `venue`|`catering`|`photo`|`video`|`floral`|`music_band`|
  `music_dj`|`hair_makeup`|`officiant`|`transport`|`stationery`|`cake`|
  `accommodation`|`security`|`children`|`other`
- `languages[]`, `email`, `phone_e164`
- `dietary_capabilities[]` (`halal`|`kosher`|`vegetarian`|`vegan`)
- `experience_international` bool, `experience_hindu_sikh` bool
- `is_internal_conflict` bool, `conflict_team_member_id` (FK)
- `notes`, `status` enum(`active`|`paused`|`blocked`)

### `provider_service_history`
One row per (provider, wedding_project) pair when used.

### `provider_document`
Stored in Supabase Storage, metadata here.

## Budget (mirrors `tools/budget-tool.html` JSON 1:1)

### `budget_version`
- FK `wedding_project`, `is_sandbox` bool, `note`, `snapshot_blob jsonb`
- Snapshot blob is the full JSON shape of the HTML tool — round-trip safe.

### `budget_service`
- FK `event`, `category` (mirrors `provider.category`), `display_name`

### `budget_provider_option`
- FK `budget_service`, FK `provider` (nullable for "draft option")
- `status` enum(`pending`|`confirmed`|`declined`)
- Trigger: when one option's status flips to `confirmed`, sibling
  options under the same `budget_service` cascade to `declined`.

### `budget_line_item`
- FK `budget_provider_option`
- `description`, `quantity`, `unit_price`
- `vat_rate` (e.g. 0.21 / 0.10 / 0), `vat_inclusive` bool
- `currency` (3-letter), `fx_snapshot_id` (FK)

### `payment_milestone`
- FK `budget_provider_option`, `due_date`, `amount`, `status`,
  `paid_at`, `proof_storage_path`

### `currency_fx_snapshot`
- `(base, quote, rate, snapshot_at)`. Daily refresh from frankfurter.app.

## Communications

### `comm_log`
- FK `wedding_project`, `channel` enum(`email`|`whatsapp`|`call`|`meeting`|`other`)
- `direction` enum(`in`|`out`)
- `language` enum(`en`|`es`|`ca`|`other`), `raw_text`, `summary`
- `at_party` enum(`couple`|`provider`|`internal`|`external`)
- `provider_id` nullable, `team_member_id` nullable

### `comm_flag`
- FK `comm_log`, `flag` enum: `BUDGET`|`TIMELINE`|`DECISION_NEEDED`|
  `DEADLINE`|`TO_CONFIRM`|`CONFLICT`|`CULTURAL`|`LEGAL`|`URGENT`

## Documents

### `document`
- FK `wedding_project`, `kind` enum: `brief`|`initial_proposal`|`contract`|
  `master_budget`|`provider_budget`|`visit_agenda`|`guest_list`|
  `seating_plan`|`day_of_timeline`|`collateral_timeline`|`rfq_outreach`|
  `provider_proposal`
- `language`, `current_version_id` (FK)

### `document_version`
- FK `document`, `version_number`, `body_md`, `storage_path`, `note`

## Couple brief & checklists

### `couple_brief`
- FK `wedding_project`, `body_md` (markdown), `to_confirm[] jsonb`,
  `cultural_flags[]`

### `ceremony_checklist`
- FK `wedding_project`, `kind` enum(`hindu`|`sikh`|`jewish`|`civil`|
  `catholic`|`interfaith`)
- `items jsonb` (array of `{id, label, status, owner}`)

## Day-of & seating (port of HTML tools)

### `timeline_block`
- FK `event`, `start_time`, `end_time`, `section` enum (matches XLSX colour codes)
- `title`, `description`
- `contact_team_member_id` nullable, `contact_provider_id` nullable
- `color_token` (from `packages/ui` brand)

### `seating_plan`
- FK `event`, `floorplan_svg jsonb`, `version`

### `seating_table`
- FK `seating_plan`, `label`, `seats`, `shape`, `position jsonb`

### `guest`
- FK `wedding_project`, `display_name`, `surname_confidential` (encrypted),
  `dietary[]`, `notes`, `seated_table_id` nullable

## Audit & AI

### `audit_log`
- `team_member_id`, `at`, `action`, `target_table`, `target_id`,
  `payload jsonb`

### `ai_run`
- `at`, `feature` (e.g. `translate-proposal`, `master-ai`),
  `model`, `tokens_in`, `tokens_out`, `cost_eur`, `latency_ms`,
  `status` (`ok`|`failed`|`partial`)
- `team_member_id`, `wedding_project_id` nullable, `agent_conversation_id` nullable

### `coi_acknowledgement`
- `team_member_id`, `provider_id`, `wedding_project_id`, `acknowledged_at`,
  `acknowledged_by` (Jennifer)

## Master AI (per-planner private)

### `agent_conversation`
- `owner_team_member_id` (FK `team_member`, NOT NULL)
- `front` enum(`in_app`|`email`|`whatsapp`)
- `wedding_project_id` nullable (AI-inferred context; null while ambiguous)
- `title` (auto-summarised), `started_at`, `last_message_at`
- `is_shared_to_team` bool default false
- **RLS:** `owner_team_member_id = auth.uid_team_member()` OR
  (`is_shared_to_team = true` AND requester is on `wedding_project.secondary_planner_ids` or is `lead_planner_id`).

### `agent_message`
- `conversation_id`, `role` enum(`planner`|`assistant`|`tool`),
  `content`, `attachments jsonb[]`
- `tool_calls jsonb[]`, `tool_results jsonb[]`
- `model`, `tokens_in`, `tokens_out`, `created_at`

### `agent_tool_invocation`
- `message_id`, `tool_name`, `args jsonb`, `result jsonb`,
  `status` enum(`ok`|`failed`|`denied_by_rls`)

## Integrations

### `mailbox_connection`
- `team_member_id`, `provider` enum(`gmail`|`m365`)
- `oauth_tokens jsonb` (encrypted), `watched_labels[]`, `last_sync_at`,
  `status` enum(`active`|`needs_reconnect`|`paused`)

### `calendar_connection`
- Same shape, `provider` enum(`google`|`m365`).

### `whatsapp_message`
- Raw payload mirror: `wa_message_id`, `wa_phone_id`, `direction`,
  `from_e164`, `to_e164`, `body`, `media_storage_path` nullable,
  `payload_raw jsonb`, `classified_as` enum(`agent_message`|`comm_log`|`triage`)
- FK to either `agent_message_id` or `comm_log_id` once classified.

### `whatsapp_template`
- `name`, `language`, `category`, `body`, `meta_status`, `submitted_at`,
  `approved_at`

## Views

### `v_coi_flags`
Returns rows wherever a Roc 35 option is selected on a wedding where Núria
is not the lead planner (or vice-versa). Drives the amber banner.

### `v_master_ai_visible_conversations`
Per-planner: own conversations + shared conversations on weddings the
planner is assigned to. Used by the chat panel sidebar.

## Conventions

- **Encrypted columns** use `pgcrypto`'s `pgp_sym_encrypt` with a key from
  Supabase Vault. Decrypt only inside a `SECURITY DEFINER` function that
  checks role.
- **Soft deletes** with `deleted_at` (nullable) on `couple`,
  `wedding_project`, `provider`, `agent_conversation`. RLS hides
  `deleted_at IS NOT NULL` rows except for the owner role.
- **Numeric money**: `numeric(14,2)` everywhere; never floats.
- **Timestamps** are `timestamptz`, stored UTC; UI formats to
  `Europe/Madrid` for display.
