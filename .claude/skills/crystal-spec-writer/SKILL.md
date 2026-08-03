---
name: crystal-spec-writer
description: Authors and updates docs/*.md and docs/ADR/*.md in the Crystal Events house format. Use when creating a new spec, refreshing an existing one, or proposing an architectural decision record. Never duplicates content from prompts/00-context-company.md.
---

# crystal-spec-writer

## When to invoke

- Adding a new file under `docs/` (PRD slice, sub-system spec).
- Updating an existing `docs/*.md` after a feature/scope change.
- Drafting a new ADR (`docs/ADR/<n>-<slug>.md`).
- Reviewing a PR that touches `docs/` for house-format compliance.

## House format — `docs/*.md`

Every doc has:

1. `# <Title>` (1 line).
2. A short opening paragraph stating audience and purpose.
3. Sections in the right order for the doc kind (see below).
4. Tables wherever a list of paired items would be clearer.
5. No emoji. No marketing copy. UK English.

### Section order by kind

- **PRD** — Why → JTBD per role → User stories → Success metrics → Out of scope → Non-goals.
- **Architecture** — High-level diagram → Surfaces → Trust boundaries → Data flow (worked example) → Background jobs → Observability → Failure modes.
- **Data model** — Conventions → Per-domain tables → Views → Conventions (encryption, soft delete, money, time).
- **RBAC / Security / GDPR** — Lawful basis → Data map → Sub-processors → Subject rights → Breach plan.
- **Domain checklists (Hindu, Jewish)** — Pre-events → Ceremony essentials → Catering → Logistics → Required AI checks.

## House format — ADRs

```
# ADR <NNNN> — <short title>

**Status:** Accepted | Proposed | Superseded by ADR ...
**Date:** YYYY-MM-DD

## Context
1–3 paragraphs. What's true today and why a decision is needed.

## Decision
The decision in plain language. Bullet points are fine.

## Alternatives considered
Each alt + why rejected.

## Consequences
Honest list — including downsides and risks.
```

## Don't

- Don't restate what `prompts/00-context-company.md` already says (team
  names, languages, what we don't do, etc.). Reference it.
- Don't write multi-paragraph docstrings that future readers will skim.
  One short paragraph + bullet structure beats prose for ops docs.
- Don't add emojis.
- Don't propose a stack change without an ADR (the rule applies to
  this skill itself).

## Templates

### `docs/<NEW-DOC>.md` skeleton

```markdown
# <Title>

> Audience: <who>. <One-sentence purpose.>

## <First section>
...
```

### `docs/ADR/<NNNN>-<slug>.md` skeleton

```markdown
# ADR <NNNN> — <short title>

**Status:** Proposed
**Date:** YYYY-MM-DD

## Context

## Decision

## Alternatives considered

## Consequences
```

## Workflow

1. Confirm the doc's place in the index (update `README.md` and
   `docs/CHANGELOG.md`).
2. Draft the body.
3. Cross-link to related docs at the end (`See also: docs/X.md`) when
   relevant.
4. If the doc is an ADR, ensure consequences include both upside and
   downside.

## Quality checks before commit

- [ ] No duplication of `prompts/00-context-company.md` content.
- [ ] Tables used where a paired list would be clearer.
- [ ] UK English; no Americanisms (color → colour).
- [ ] No marketing language.
- [ ] No emoji.
- [ ] Cross-references resolve.
