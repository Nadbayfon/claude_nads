---
name: crystal-master-ai-tool-author
description: Scaffolds a Master AI tool under packages/ai/tools/<name>.ts. Defines JSON schema, RLS-aware DB query or feature-agent call, dialog eval fixtures. Ensures tool descriptions are unambiguous so the model picks the right one. Use when adding a tool to the Master AI's registry.
---

# crystal-master-ai-tool-author

## When to invoke

- Adding a new tool to the Master AI registry.
- Updating an existing tool's input/output schema.
- Investigating "wrong tool called" bugs (the fix is usually a
  description rewrite + eval fixture).

## Tool shape

`packages/ai/tools/<name>.ts`:

```ts
import { z } from "zod";
import type { Tool } from "@crystal/ai/tools/types";

export const search_couple: Tool = {
  name: "search_couple",
  description:
    // ONE LINE. Unambiguous. No "this tool" / "use this when".
    "Find a couple by display name (e.g. 'Sham & Shwan') or by wedding date (YYYY-MM-DD). Returns the couple's id, display name, wedding date, lead planner, and status.",
  inputSchema: z.object({
    query: z.string().min(1),
  }),
  outputSchema: z.object({
    matches: z.array(z.object({
      couple_public_id: z.string().uuid(),
      display_name: z.string(),
      wedding_date: z.string().nullable(),
      lead_planner_name: z.string(),
      status: z.enum(["enquiry", "active", "confirmed", "delivered", "closed"]),
    })),
  }),
  run: async (input, ctx) => {
    // ctx.supabase is the planner-scoped client (RLS enforced).
    const { data, error } = await ctx.supabase
      .from("couple")
      .select("public_id, display_name, wedding_project!inner(wedding_date, lead_planner:team_member!inner(display_name), status)")
      .or(`display_name.ilike.%${input.query}%,wedding_project.wedding_date.eq.${input.query}`)
      .is("deleted_at", null)
      .limit(10);

    if (error) {
      if (error.code === "42501" /* insufficient_privilege */) {
        return { ok: false, reason: "denied_by_rls" as const };
      }
      throw error;
    }

    return { ok: true, data: { matches: shape(data) } };
  },
};
```

## Description rules — the #1 source of bugs

The description is what the model reads to pick the tool. Bad
descriptions cause wrong-tool-called bugs that look like "the AI
hallucinated".

DO:
- One line. One verb. Concrete inputs and outputs.
- Use words the planner uses ("couple", "wedding date", "RFQ",
  "provider").
- Disambiguate from neighbour tools explicitly when needed
  ("Search for **a couple**, not a provider — see `lookup_provider`
  for that").

DON'T:
- "This tool searches the database." (vague)
- "Use when needed." (begging the question)
- "Helper for finding things." (catastrophic)

## RLS handling

Tools always receive a planner-scoped Supabase client
(`ctx.supabase`). Two things to watch:

1. **Don't use the service-role key.** A skill lint flag fires on
   any `import.*service_role` inside `packages/ai/tools/*`.
2. **Translate RLS denials** into structured `denied_by_rls` results.
   Don't throw, don't paraphrase — the runtime turns this into "I
   can't see that wedding from your account".

```ts
if (error?.code === "42501") return { ok: false, reason: "denied_by_rls" };
```

## Dialog eval fixtures

Every new tool ships with at least:

1. **Right-tool-called** — a 1-turn dialog that should pick this tool.
2. **Wrong-tool-rejection** — a 1-turn dialog that should NOT pick
   this tool (covers neighbours).
3. **Denied-by-RLS** — a planner asks about something they can't
   see; tool returns `denied_by_rls`; AI surfaces refusal politely.

Place fixtures at `packages/ai/evals/master-ai/<tool>/*.json`:

```json
{
  "name": "search_couple_baseline",
  "planner": "jennifer",
  "turns": [
    {
      "role": "planner",
      "content": "where are we with sham & shwan?"
    }
  ],
  "expect": {
    "tools_called_in_order": ["search_couple", "get_wedding_overview"],
    "assistant_must_include": ["Sham & Shwan"],
    "assistant_must_not_include": ["<surname>"]
  }
}
```

## Confirmation step for outbound tools

Tools that send things outward (`compose_email_draft`,
`schedule_calendar_event`, `send_whatsapp_template`,
`share_conversation_with_team`) must require an explicit
confirmation turn — the AI proposes, the planner confirms, then the
tool runs. Encode this in the description:

> "Compose an email draft in the planner's connected mailbox. Only
> call after the planner has confirmed the recipient and content in
> the previous turn."

Eval fixtures must verify the confirmation flow.

## Don't

- Don't call `anthropic.messages.create` from inside a tool. Tools
  are pure functions of (input, planner context) → result.
- Don't return free-form strings as the primary result. Always
  structured output the agent runtime can interpret.
- Don't fan out to multiple unrelated DB tables in one tool — split
  into multiple tools so the model's planning is legible.
- Don't expose a "post to social media" tool or any tool that would
  let the AI do something the planner hasn't requested.
