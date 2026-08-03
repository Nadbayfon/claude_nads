# CLAUDE.md — Repo-wide guidance for Claude Code

This file is loaded at the start of every Claude Code session in this repo.
Keep it short — domain context lives in `prompts/00-context-company.md`,
which every AI feature loads at runtime.

## What this codebase is

Two surfaces in one Next.js + Supabase monorepo:

1. **Workspace** — planner-facing app at `app.crystalevents.eu`.
2. **Master AI** — conversational agent reachable from three fronts
   (in-app chat, email, WhatsApp) that share one runtime and tool registry.

Source-of-truth domain knowledge is in `prompts/*.md`. Editing those files
hot-reloads the relevant feature agent. Don't duplicate domain content into
TypeScript constants — load the .md.

## Stack

- **Next.js 15** App Router + React Server Components, TypeScript strict
- **Supabase** (Postgres + Auth + Storage), RLS on every table
- **Anthropic API** with prompt caching (`cache_control: ephemeral`)
- **Tailwind** + brand tokens from `packages/ui`
- **pnpm** workspaces + **Turborepo**
- **Vercel** for hosting (eu-west / Frankfurt or Ireland)

## Conventions

- **Languages**: planner UI in English; provider-facing output in CA/ES;
  couple-facing output in EN. CI fails when a string lands in the wrong
  locale (see `crystal-i18n` skill).
- **Database**: every table has `id bigserial`, `public_id uuid`,
  `created_at`, `updated_at`, `created_by`, and an explicit RLS policy.
- **Sensitive columns** (passport, IBAN, full surnames): encrypted at rest
  via `pgcrypto`. Document new sensitive columns in `docs/GDPR.md`.
- **Anthropic calls**: set `cache_control: { type: "ephemeral" }` on the
  system prompt; set zero-retention header on any call carrying PII.
- **Per-feature agent** lives at `apps/web/server/ai/<name>.ts` and
  references a prompt file at `prompts/<name>.md`. Both shapes (input,
  output) are zod schemas.
- **Master AI tools** live at `packages/ai/tools/<name>.ts`. Tool
  invocations honour the planner's RLS — never use a service-role key
  inside a tool that runs from a planner conversation.
- **Per-planner private**: `agent_conversation` rows are owner-scoped.
  Anything that returns conversation data must filter by
  `owner_team_member_id = auth.uid()` unless `is_shared_to_team = true`.

## Skills

When a task matches one of the dedicated skills in `.claude/skills/`,
invoke it via the Skill tool rather than reasoning from scratch:

- `crystal-spec-writer` — author/update `docs/*.md` and ADRs
- `crystal-data-modeller` — Supabase migrations + RLS + zod types
- `crystal-ai-agent-dev` — scaffold a feature agent from a prompt .md
- `crystal-master-ai-tool-author` — scaffold a Master AI tool
- `crystal-integrations-engineer` — Gmail/M365/Calendar/WhatsApp/Whisper
- `crystal-pdf-parser` — provider proposal extraction (ES/CA fine print)
- `crystal-i18n` — locale catalogues and lints
- `crystal-gdpr-reviewer` — PII / retention / zero-retention audit
- `crystal-export-author` — XLSX/PDF exporters per brand spec
- `crystal-onboarding-doc` — refresh planner-facing cheat-sheets

## Things not to do

- Don't post AI output to provider-facing surfaces without running the
  PII-leakage check (no surnames, no couple budget figures).
- Don't add new external surfaces (Telegram, Slack) without an ADR.
- Don't duplicate `prompts/00-context-company.md` content into code or docs.
- Don't bypass RLS with the service-role key from planner-triggered code.
- Don't commit golden fixtures that contain real couple PII — use the
  Sham & Shwan fixture, which is already authorised for internal use.

## Running

```sh
pnpm install
pnpm --filter web dev      # Next.js on http://localhost:3000
pnpm --filter web typecheck
pnpm typecheck             # all packages
pnpm lint
```

Local Supabase requires the Supabase CLI:

```sh
supabase start
supabase db reset          # applies packages/db/migrations/*.sql
pnpm --filter db codegen   # regenerate src/types/database.ts
```

`apps/web/.env.example` lists the env vars. Copy to `.env.local`
and fill in `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
to sign in.
