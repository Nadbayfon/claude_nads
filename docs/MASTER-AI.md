# Master AI

The Master AI is one conversational agent reachable from three fronts —
in-app chat panel, email, WhatsApp — that share one runtime and one
tool registry.

## Why one agent, three fronts

Planners switch surfaces all day. Jennifer might ask a question on
WhatsApp at 09:00 while walking to a venue, open the laptop at 11:00,
and continue the same thread. Emails forwarded to `ai@crystalevents.eu`
become messages in the same conversation.

Forcing planners to repeat context every time they switch surface is the
exact friction we're removing.

## Privacy model: per-planner private by default

A `agent_conversation` row is **owned** by one `team_member`. RLS denies
read access to other planners unless either:

1. `is_shared_to_team = true` (owner explicitly promoted it), AND the
   requester is on the linked `wedding_project`'s `lead_planner_id` or
   `secondary_planner_ids[]`, OR
2. The chat has been converted to a `comm_log` entry (the entry inherits
   the wedding's normal RLS).

This is intentional. Jennifer and Núria each run their own weddings; what
they each ask their AI is theirs alone unless they choose otherwise.

### Promote-to-team flow

1. Planner clicks "promote to team" in the in-app panel, or texts
   `/share` on WhatsApp, or replies `share` to the AI's email.
2. AI confirms which wedding the conversation should attach to (if not
   already inferred).
3. `is_shared_to_team` flips to true; the linked wedding's planners now
   see the conversation read-only in the chat sidebar.
4. The owner can flip it back to false at any time; the audit log records
   both transitions.

### Convert-to-comm-log flow

1. Planner clicks "save to comm log" — typically because the AI
   summarised a phone call or drafted something the team should reference.
2. AI proposes a `comm_log` entry (channel, direction, summary, flags).
3. Planner confirms; entry is created on the wedding's normal comm log
   under the planner's identity. The original `agent_message` rows stay
   private to the owner; only the summarised `comm_log` row is shared.

## Tool registry

See `docs/AI-AGENTS.md` for the v1 tool list. Two non-obvious rules:

- **Tools run with the owner's RLS context.** If Jennifer's tool tries to
  read Núria's wedding, RLS denies and the tool returns
  `{ ok: false, reason: "denied_by_rls" }`. The AI should surface this as
  "I can't see that wedding from your account" rather than retrying.
- **Tools that send things to the outside world** (`compose_email_draft`,
  `schedule_calendar_event`, `send_whatsapp_template`) require an
  explicit confirmation step in the conversation: the AI proposes, the
  planner says "send" / "ok" / replies with the draft text, then the AI
  calls the tool. No silent outbound.

## Conversation state

| Field | Source |
|---|---|
| owner | `team_member` resolved from auth (in-app), email address (email), phone (WhatsApp) |
| wedding context | Inferred from the planner's last message + recent activity; null while ambiguous; AI may ask "for Sham & Shwan?" |
| front | Set per inbound message; one conversation can have messages from multiple fronts |
| title | Auto-summarised from the first ~3 turns |

## Cross-front identity

A `team_member` row links three surfaces:

- `auth_user_id` for in-app
- `email` for inbound mail (matched against `From:`)
- `phone_e164` for WhatsApp (matched against sender)

If a planner sends WhatsApp from an unregistered number, the AI replies:
"this number isn't on your profile yet — please add it in the workspace
under Settings → My identities". It does **not** guess.

## Conversation evals

Scripted multi-turn dialogs in `packages/ai/evals/master-ai/*.json`. Each
fixture declares:

- An ordered list of planner turns
- Expected tool name(s) called per turn (regex-matched)
- Expected key facts in the assistant's reply (substring or schema check)
- Whether `share_conversation_with_team` should fire

Examples:

- `next-deadlines.json` — "what's Sham & Shwan's next deadline?" → must
  call `get_wedding_overview` or `next_deadlines`, must include the
  correct date.
- `draft-rfq-from-whatsapp.json` — "draft an RFQ to La Floreria for
  Sham & Shwan" → must call `lookup_provider` then `draft_rfq`, must
  not include surnames in the draft body (PII gate).
- `wrong-planner-cant-see.json` — Núria asks about a Jennifer-only
  wedding; tools return `denied_by_rls`; AI surfaces refusal politely.

## What the Master AI is not

- Not a couple-facing channel. Couples never message the AI directly in
  v1; their messages reach the planners via the regular comm log.
- Not autonomous. It proposes; planners approve outbound actions.
- Not a memory bank for sensitive PII. Surnames, passport numbers, IBANs
  are decrypted only in `SECURITY DEFINER` functions and never echoed
  back into provider-facing tool outputs.
