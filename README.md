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

**Phase 3 published release.** Auth, couples, projects, events, and the tree
budget module (services → providers → line items → milestones, with VAT and
JSON round-trip to `tools/budget-tool.html`) are live.

Phases 3.5 → 8 (Master AI, email, WhatsApp, calendar sync, day-of timeline,
PWA, GDPR hardening) are scoped in [docs/ROADMAP.md](docs/ROADMAP.md) and
will land in follow-up releases.

## Deploying the published release

Follow **[docs/SETUP.md](docs/SETUP.md)** — a ~45-minute step-by-step that
takes you from an empty Supabase + Vercel account to a live URL signed in
as Jennifer. Security guarantees for this release are documented in
**[docs/SECURITY-PHASE-3.md](docs/SECURITY-PHASE-3.md)**.

### One-click Vercel deploy

After you've created the Supabase project (Step 1 in SETUP.md), use this
button — Vercel will prompt for the three env vars and set the root
directory to `apps/web`:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNadbayfon%2Fclaude_nads&env=NEXT_PUBLIC_SUPABASE_URL%2CNEXT_PUBLIC_SUPABASE_ANON_KEY%2CSUPABASE_SERVICE_ROLE_KEY&envDescription=Get%20these%20three%20from%20Supabase%20Settings%20%E2%86%92%20Data%20API&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard&project-name=crystal-events&root-directory=apps%2Fweb)

## Working in this repo with Claude Code

[CLAUDE.md](CLAUDE.md) carries repo-wide guidance. Dedicated skills live in
[.claude/skills/](.claude/skills/) — see each skill's `SKILL.md` for what it
does and when to invoke it.
