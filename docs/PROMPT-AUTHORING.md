# Prompt authoring

`prompts/*.md` are the single source of truth for AI behaviour. Every
feature agent and the Master AI tool registry references them. This doc
is the house style for editing or adding prompts.

## File header (required)

```markdown
# <Agent name> — <one-line purpose>

**When to use:** ...
**Goal:** ...
**Time to run:** ...
**Output:** ...

---
```

## Body sections (required, in order)

1. `## Prompt` — narrative instructions to the model. Always start with
   "You are the AI assistant for a luxury destination wedding planning
   company based in Barcelona…" so a prompt works in isolation if the
   system context is unavailable.
2. `### Input (paste here)` — describes/marks the input slot. Use a
   placeholder like `[PASTE EMAIL / NOTES / FORM / CALL TRANSCRIPT]`.
3. `### Output format` — exact structure the model must produce. For
   feature agents, this is JSON-shaped Markdown that maps to the agent's
   `outputSchema`. For Master AI tool descriptions, this is a one-line
   "what this tool does" + JSON schema.
4. `### Examples` (optional but encouraged for new agents).

## Rules

- **Never duplicate `00-context-company.md`.** If you need a fact already
  there (team names, languages, geography, photo policy), reference the
  context, don't restate it.
- **Always mark missing fields `[TO CONFIRM]`** in any structured output.
  Never invent.
- **Keep PII out of provider-facing outputs**: surnames, IBAN, passport
  numbers, and the couple's total budget never appear in CA/ES outreach.
- **Locale per audience**: couple-facing → EN; provider-facing → CA/ES;
  internal → EN. Don't mix.
- **Money**: always print currency code + numeric. Use 21% / 10% VAT
  vocabulary that matches Spanish/Catalan tax wording (`IVA incluido`,
  `IVA inclòs`, `+ IVA`).

## Edit workflow

1. Open a PR that touches `prompts/<name>.md`.
2. CI re-runs the eval set for the agent that loads that prompt.
3. If evals fail, fix the prompt or update the golden fixtures (with a
   second reviewer for fixture changes).
4. PR description must include before/after sample outputs on the
   Sham & Shwan fixture.

## Version control inside prompts

Use a `> Last updated: YYYY-MM-DD` line at the top. The
`crystal-ai-agent-dev` skill enforces this when scaffolding a new agent.

## Anti-patterns

- ❌ Hard-coded planner names inside a prompt (use `{{lead_planner_name}}`
  variable instead, populated by the agent runtime).
- ❌ Telling the model to "respond as JSON" without a schema example.
- ❌ Long preambles before the actual task. Models execute best with
  task-first prompts.
- ❌ Asking the model to "verify GDPR" — that's a code-side check.
