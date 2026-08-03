---
name: crystal-onboarding-doc
description: Generates and refreshes docs/PLANNER-ONBOARDING.md and per-feature 1-page cheat-sheets for each planner role. Produces the "how to use Master AI on WhatsApp" quick-start. Use when a feature ships, when role responsibilities change, or quarterly to keep onboarding accurate.
---

# crystal-onboarding-doc

## When to invoke

- A new feature ships and changes daily planner workflow.
- A role's permissions change (RBAC update).
- Quarterly refresh.
- A planner reports an outdated onboarding doc.

## Audience

The four planners: Jennifer (owner), Núria (planner), Róisín
(stylist), Jackie (admin). Plus external assistants per event.

## Output documents

### Primary: `docs/PLANNER-ONBOARDING.md`

The daily-use guide. Already exists; this skill keeps it current.

Edit-preserving rule: any block wrapped in `<!-- KEEP -->`
... `<!-- /KEEP -->` survives regeneration. Use this for hand-tuned
language or organisation-specific tips.

### Secondary: `docs/cheat-sheets/<feature>-<role>.md`

One-page cheat-sheets per (feature, role) pair where it matters.
Targets:

- `master-ai-whatsapp-jennifer.md`
- `master-ai-whatsapp-jackie.md`
- `master-ai-email-jennifer.md`
- `budget-extract-jennifer.md`
- `rfq-jennifer.md`
- `seating-roisin.md`
- `provider-db-jackie.md`
- `wedding-day-digest-team.md`

## Voice

- Address the planner directly ("you").
- Short. One A4 page max.
- Concrete examples over abstract instructions.
- No marketing copy. No "powered by AI" framing.

## Cheat-sheet template

```markdown
# <Feature> — for <Role first name>

## What this does for you
<2 sentences.>

## Try it
1. <First concrete action.>
2. <...>
3. <...>

## Examples to copy

> "<example planner phrasing 1>"
> "<example planner phrasing 2>"

## Where it fits in your day
<1–2 sentences.>

## Things it won't do
- <bullet>
- <bullet>

## When something feels wrong
<Where to click 👎 / what to say.>
```

## Generation procedure

1. Pull the current state from:
   - `docs/PRD.md` for what's shipped
   - `docs/RBAC.md` for role boundaries
   - `prompts/*.md` for example planner phrasings (the input examples
     in the prompt files are perfect for cheat-sheets)
   - `docs/MASTER-AI.md` for the share / save-to-comm-log flows
   - `docs/INTEGRATIONS.md` for OAuth setup steps
   - `docs/WHATSAPP.md` for the business-number flow
2. Diff against the existing onboarding doc.
3. Update only the blocks not marked `<!-- KEEP -->`.
4. Add new cheat-sheets where a feature has shipped without one.
5. Mark stale cheat-sheets (referenced features that no longer
   exist) for deletion in a PR comment — do not delete silently.

## Distribution

- Onboarding doc lives in the repo + the in-app help drawer renders
  it.
- Cheat-sheets live in the repo + are exported to PDF (the
  `crystal-export-author` skill) for offline reference.

## Don't

- Don't write a tutorial that's longer than one A4 page.
- Don't include screenshots that go stale fast — describe the
  navigation in words.
- Don't paste prompt internals; planners should never see the model's
  system prompt.
- Don't overwrite `<!-- KEEP -->` blocks.
- Don't make the doc try to be a marketing brochure. It's an
  operations doc.
