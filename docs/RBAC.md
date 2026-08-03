# RBAC — Role × resource × action

Roles map onto `team_member.role`. RLS encodes these rules; this doc is
the human-readable source of truth.

## Roles

- **owner** — Jennifer. All-access; only role allowed to acknowledge COI.
- **planner** — Núria, plus future planners. Full access to weddings
  they're assigned to.
- **stylist** — Róisín. Read access to assigned weddings; write on
  `seating_plan`, `event`, `document` (kinds: brief, visit_agenda).
- **admin** — Jackie. Read access to assigned weddings; write on
  `provider_*`, `comm_log`, `payment_milestone`.
- **external_assistant** — per-event role; auto-revoked 7 days after
  the wedding date.

## Matrix

`R` = read, `W` = write, `–` = denied, `O` = owner-only.

| Resource | owner | planner (assigned) | planner (other) | stylist (assigned) | admin (assigned) | external (assigned) |
|---|---|---|---|---|---|---|
| `team_member` | RW | R | R | R | R | – |
| `couple` | RW | RW | – | R | R | R (limited cols) |
| `wedding_project` | RW | RW | – | R | R | R (limited cols) |
| `event` | RW | RW | – | RW | R | R |
| `provider` | RW | RW | RW | R | RW | – |
| `budget_*` | RW | RW | – | – | R | – |
| `payment_milestone` | RW | RW | – | – | RW | – |
| `comm_log` | RW | RW | – | R | RW | R |
| `document` | RW | RW | – | RW (brief, visit_agenda) | RW (rfq, contract drafts) | R |
| `couple_brief` | RW | RW | – | R | R | R |
| `ceremony_checklist` | RW | RW | – | R | R | – |
| `timeline_block` | RW | RW | – | RW | R | R |
| `seating_*` | RW | RW | – | RW | R | R |
| `guest` | RW | RW | – | R | RW | R (no surname) |
| `audit_log` | R | R (own) | R (own) | R (own) | R (own) | – |
| `ai_run` | R | R (own) | R (own) | R (own) | R (own) | – |
| `coi_acknowledgement` | RW | R | R | R | R | – |
| `agent_conversation` | RW (own) | RW (own) + R (shared) | – | RW (own) | RW (own) | – |
| `agent_message` | (mirrors conversation) | | | | | |
| `mailbox_connection` | RW (own) | RW (own) | – | RW (own) | RW (own) | – |
| `calendar_connection` | RW (own) | RW (own) | – | RW (own) | RW (own) | – |
| `whatsapp_message` | R | R (own + assigned weddings) | – | R (assigned) | R (assigned) | R (assigned) |
| `whatsapp_template` | RW | R | R | R | R | – |

## Specific gates

- **Confirming a `budget_provider_option`** when the option is on Roc 35
  and Núria is not lead planner is blocked until a row exists in
  `coi_acknowledgement` for that `(team_member_id=Núria, provider=Roc 35,
  wedding_project_id)` signed by `owner` Jennifer.
- **Decrypting `couple.surnames_confidential` / `guest.surname_confidential`**
  is only allowed inside `SECURITY DEFINER` functions called from server
  code that has authenticated as `owner` or as the assigned planner. The
  Master AI never receives decrypted surnames inside provider-facing
  outputs.
- **Promoting `agent_conversation.is_shared_to_team`** to true requires the
  conversation owner (no other role can do it for them).
- **Connecting / revoking `mailbox_connection`** is owner-only over the
  planner's own row — no other planner may touch another's connection.

## auth.uid_team_member()

Helper SQL function used in every RLS policy:

```sql
create or replace function auth.uid_team_member()
returns bigint
language sql stable
as $$
  select id from public.team_member
  where auth_user_id = auth.uid()
$$;
```

Wedding-membership helper:

```sql
create or replace function auth.is_assigned(wp public.wedding_project)
returns boolean
language sql stable
as $$
  select wp.lead_planner_id = auth.uid_team_member()
      or auth.uid_team_member() = any(wp.secondary_planner_ids)
$$;
```
