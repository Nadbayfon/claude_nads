---
name: crystal-ai-agent-dev
description: Scaffolds a feature agent under apps/web/server/ai/<name>.ts from a prompts/<name>.md file. Wraps the built-in claude-api skill with Crystal Events specifics — model router, prompt caching, zod schemas, eval stub, server action. Use when adding a new feature agent or refactoring an existing one.
---

# crystal-ai-agent-dev

## When to invoke

- A new prompt file lands at `prompts/<name>.md` and a feature agent
  needs to wrap it.
- An existing feature agent's input/output contract changes.
- Migrating a feature agent across model versions (e.g. Sonnet 4.6 →
  4.7).

## Wraps `claude-api`

Always invoke the built-in `claude-api` skill for SDK details
(prompt caching headers, message ordering, tool-use envelope). This
skill adds the Crystal Events conventions on top.

## Module shape

`apps/web/server/ai/<name>.ts`:

```ts
import { z } from "zod";
import { systemPrompt } from "@crystal/ai/system-prompt";
import { selectModel } from "@crystal/ai/model";
import { anthropic } from "@crystal/ai/client";
import { recordRun } from "@crystal/ai/runs";

export const inputSchema = z.object({
  // strict — no `any`
});

export const outputSchema = z.object({
  // strict — no `any`
});

export const agent = {
  name: "<name>",
  promptFile: "<name>.md",
  modelTier: "default" as const, // "heavy" | "default" | "light"
  inputSchema,
  outputSchema,
  mayContainPII: true, // governs zero-retention header
  run,
};

async function run(input: z.infer<typeof inputSchema>, ctx: AgentContext) {
  const model = selectModel(agent.modelTier);
  const prompt = await loadPrompt(agent.promptFile);
  const start = Date.now();

  const res = await anthropic.messages.create({
    model,
    system: systemPrompt(),                   // cached
    max_tokens: 4096,
    extra_headers: agent.mayContainPII
      ? { "anthropic-beta": "zero-retention-2024-01-01" }
      : undefined,
    messages: [
      { role: "user", content: renderUserContent(prompt, input) },
    ],
  });

  const parsed = outputSchema.parse(extractJson(res));

  await recordRun({
    feature: agent.name,
    model,
    tokens_in: res.usage.input_tokens,
    tokens_out: res.usage.output_tokens,
    cache_hit_tokens: res.usage.cache_read_input_tokens ?? 0,
    latency_ms: Date.now() - start,
    status: "ok",
    team_member_id: ctx.team_member_id,
    wedding_project_id: input.wedding_project_id ?? null,
  });

  return parsed;
}
```

## Server action wrapper

`apps/web/app/(workspace)/<feature>/actions.ts`:

```ts
"use server";
import { agent } from "@/server/ai/<name>";

export async function run<Name>Action(input: unknown) {
  const ctx = await getPlannerContext();
  const validated = agent.inputSchema.parse(input);
  return agent.run(validated, ctx);
}
```

## Eval stub

`packages/ai/evals/<name>/golden.ts`:

```ts
import { agent } from "@/server/ai/<name>";

export const fixtures = [
  {
    name: "sham-shwan-baseline",
    input: { /* ... */ },
    assertions: [
      { kind: "schema", schema: agent.outputSchema },
      { kind: "no-pii-leak", forbidden: ["<surname>"] },
      { kind: "field-includes", path: "summary_for_couple_update", value: "" },
    ],
  },
];
```

CI runs the evals on PRs that touch:
- `prompts/<name>.md`
- `apps/web/server/ai/<name>.ts`
- `packages/ai/src/system-prompt.ts`
- `packages/ai/src/model.ts`

## Model tier defaults (from `docs/AI-AGENTS.md`)

| Agent | Tier |
|---|---|
| `couple-intake` | default |
| `communications-update` (comm log flag tagging) | light |
| `translate-brief` | default |
| `translate-proposal` | heavy |
| `initial-proposal` | default |
| `contract-draft` | heavy |
| `visit-agenda` | default |
| `budget-update` | default |
| `weekly-status-email` | default |
| `hindu-sikh-ceremony-check` | light |
| `jewish-ceremony-check` | light |
| `options-comparison` | default |
| `day-of-timeline` First Draft | heavy |

## Don't

- Don't bypass `systemPrompt()` — it's the cached company context.
  Re-implementing it loses cache savings and drifts.
- Don't use `any` in schemas. zod strict.
- Don't call `anthropic.messages.create` outside the agent module —
  always go through `apps/web/server/ai/*` and the helpers.
- Don't ship a feature agent without an eval fixture.
- Don't omit `mayContainPII` — it gates the zero-retention header.
