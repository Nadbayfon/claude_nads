# Crystal Events — Integrated Wedding-Planning App

Monorepo for the Crystal Events planner workspace and Master AI agent.

Crystal Events is a luxury destination wedding-planning company in Barcelona
specialising in foreign couples (USA / UK / Middle East / SE Asia), 80–300
guests, ~25% Hindu/Sikh weddings. This repository turns the company's
existing prompt library and standalone HTML tools into one integrated
web app.

## Layout

```
apps/web/             Next.js 15 planner workspace + Master AI runtime
packages/
  db/                 Supabase migrations, generated types, seed data
  ui/                 Brand tokens + shared React components
  ai/                 Prompt loader, model router, tool registry, evals
prompts/              Source-of-truth .md prompts (loaded with prompt caching)
tools/                Archived HTML prototypes (still openable offline)
samples/              Golden fixtures used by the eval harness
docs/                 PRD, architecture, data model, ADRs, runbooks
.claude/skills/       Dedicated Claude Code skills for development
```

## Two surfaces

1. **Workspace** at `app.crystalevents.eu` — deliberate work: budgets,
   seating, timelines, dashboards, document review.
2. **Master AI**, accessible from three fronts that share one runtime:
   - in-app chat panel (Phase 3.5)
   - email via per-planner Gmail/M365 OAuth (Phase 4)
   - WhatsApp Business via Meta Cloud API (Phase 6)

Conversations are per-planner private; planners explicitly promote a chat
into a shared `comm_log` entry to make it team-visible.

## Status

Phase 0 — specifications. See [docs/ROADMAP.md](docs/ROADMAP.md) for the
phase tracker and [docs/PRD.md](docs/PRD.md) for jobs-to-be-done.

## Working in this repo with Claude Code

[CLAUDE.md](CLAUDE.md) carries repo-wide guidance. Dedicated skills live in
[.claude/skills/](.claude/skills/) — see each skill's `SKILL.md` for what it
does and when to invoke it.
