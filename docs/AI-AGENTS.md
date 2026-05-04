# AI agents

Two modes of AI use share the same infrastructure:

1. **Feature agents** — deterministic, fixed-schema. One per `prompts/<name>.md`.
2. **Master AI** — long-running conversational agent with tool use.

## Shared infrastructure

### System-prompt loader (`packages/ai/src/system-prompt.ts`)

Reads `prompts/00-context-company.md` from disk at module load and injects
it as the system prompt with prompt caching:

```ts
{
  role: "system",
  content: [
    {
      type: "text",
      text: companyContext, // ~9 KB
      cache_control: { type: "ephemeral" }
    }
  ]
}
```

Editing the .md hot-reloads (Next.js dev server) and is picked up on next
deploy in prod. No redeploy needed for prompt iteration during dev.

### Model router (`packages/ai/src/model.ts`)

| Tier | Model ID | Used for |
|---|---|---|
| Heavy | `claude-opus-4-7` | `translate-proposal`, `day-of-timeline` First Draft, `contract-draft`, Master AI when complex reasoning is needed |
| Default | `claude-sonnet-4-6` | `couple-intake`, `translate-brief`, `initial-proposal`, `weekly-status-email`, `options-comparison`, default Master AI tier |
| Light | `claude-haiku-4-5-20251001` | `comm-log` flag tagging, language/channel detection, COI checks, ceremony-applicability detection, Master AI quick lookups |

Selection rules:
- Feature agents declare their tier in their module export.
- Master AI starts at `default` and the runtime promotes to `heavy` when:
  - The latest user turn references multiple weddings/providers, OR
  - The model called >2 tools in the previous turn, OR
  - The user explicitly says "think carefully" / "compare in depth".
- Master AI demotes to `light` when the request is a single-fact lookup
  (heuristic: matches `^(what|when|who|where) (is|are)`).

### Per-feature agent module

Every feature agent at `apps/web/server/ai/<name>.ts` exports:

```ts
export const couplintake = {
  name: "couple-intake",
  model: "default",                         // tier
  inputSchema: z.object({ raw: z.string(), wedding_project_id: z.string().uuid() }),
  outputSchema: z.object({ brief_md: z.string(), to_confirm: z.array(z.string()), cultural_flags: z.array(z.string()) }),
  promptFile: "couple-intake.md",
  run: async (input, ctx) => { /* ... */ }
}
```

Server actions wrap `run`; the UI shows a diff of the structured output
against current DB state before the planner persists.

### Tool registry (`packages/ai/tools/*`)

Every workspace action exposes a tool the Master AI can call. Tools:

- Have a JSON schema declared once and reused for both Anthropic tool
  declarations and zod runtime validation.
- Always run with the planner's RLS context — they receive a
  `SupabaseClient` configured with the planner's session, never the
  service-role key.
- Return structured results (`{ ok: true, data: ... }` or
  `{ ok: false, reason: "denied_by_rls" | "not_found" | "validation" }`).
- Have unambiguous one-line descriptions so the model picks the right
  tool. Ambiguity is the #1 cause of wrong-tool-called bugs.

Initial v1 tool set:

| Tool | Purpose |
|---|---|
| `search_couple` | Find a couple by display name or wedding date. |
| `get_wedding_overview` | Status, lead planner, next deadline, money in/out. |
| `lookup_provider` | Find a provider by name or category + filters. |
| `log_comm` | Append to `comm_log` with auto-flag detection (calls Haiku internally). |
| `draft_rfq` | Wraps the `translate-brief` feature agent. |
| `extract_proposal` | Wraps the `translate-proposal` feature agent. |
| `update_budget` | Apply a structured patch to a `budget_version` (planner reviews diff before commit). |
| `add_to_timeline` | Insert a `timeline_block`. |
| `compose_email_draft` | Write a draft into the planner's connected mailbox. |
| `schedule_calendar_event` | Create an event in the planner's calendar. |
| `send_whatsapp_template` | Send an outbound WhatsApp template (only approved templates allowed). |
| `next_deadlines` | Return upcoming deadlines across the planner's weddings. |
| `share_conversation_with_team` | Flip `is_shared_to_team` to true (planner must confirm). |
| `convert_chat_to_comm_log` | Promote a chat into a `comm_log` entry on the relevant wedding. |

## Eval harness (`packages/ai/evals/`)

- **Golden fixtures** in `samples/sham-shwan/` — input PDF + expected
  budget rows + expected timeline cells.
- **CI runs evals** on PRs that touch `prompts/*.md` or `server/ai/*` or
  `packages/ai/tools/*`.
- **PII-leakage gate**: every provider-facing output is scanned against
  `couple.surnames_confidential` and the project's budget figures; any
  match fails the build.
- **Master AI dialog evals**: scripted multi-turn conversations check that
  the right tool gets called for prompts like "what's the next deadline?"
  or "draft an RFQ to La Floreria for Sham & Shwan".

## Background jobs

Sub-5s ops are server actions. Long ops (proposal extraction, full
timeline draft, Master AI tool chains >30s) go via Vercel cron + Supabase
queue. UI / WhatsApp polls `ai_run.status`.

## Anthropic retention policy

Every API call carrying PII (passports, IBAN, contracts, proposals) sets
the zero-retention header. Documented in `GDPR.md`. CI test verifies the
header is set on every code path that may include those payloads.
