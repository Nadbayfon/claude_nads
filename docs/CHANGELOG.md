# Changelog

All notable changes to the Crystal Events app are recorded here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — Phase 1

### Added
- **`packages/ui`** — brand tokens extracted from `tools/budget-tool.html`
  (charcoal `#2C2825`, gold `#C9A96E`, cream `#F5F0E8`, paper `#FAF7F2`,
  plus the green/red/blue accent set). Tailwind preset, format helpers
  (`format24h`, `formatMoney`, `slugify`, etc.), `sectionColours` for
  timeline exports.
- **`packages/db`** — migrations directory + first two migrations:
  `init_extensions` (pgcrypto, uuid-ossp, `tg_set_updated_at`) and
  `org_team_member` (org singleton, `team_member` with planner
  allow-list, `auth.uid_team_member()` helper, RLS policies). Seeds
  the four planner emails. Auth-user → team-member link enforced via
  trigger on `auth.users` insert; non-allow-listed emails are rejected.
  zod schema for `team_member`.
- **`packages/ai`** — `systemPrompt()` loader with size guard
  (cached at module scope; reads `prompts/00-context-company.md`
  per ADR 0002). Model router (Opus 4.7 / Sonnet 4.6 / Haiku 4.5),
  `buildHeaders` for zero-retention, `suggestMasterAITier` heuristic.
  Tool registry types (empty registry until Phase 3.5). Glossary.
- **`apps/web`** — Next.js 15 (App Router) + Tailwind + Supabase SSR.
  Routes: `/login` (Google SSO + magic-link), `/auth/callback`
  (OAuth code exchange with allow-list error surfacing),
  `/auth/signout`, `/` (dashboard placeholder), `/health` (edge JSON).
  Middleware gates every workspace route behind a session and bounces
  signed-in users away from `/login`.
- **CI** — `.github/workflows/ci.yml` runs typecheck + lint on PRs
  and pushes to main. Concurrency-cancelling so older runs are
  superseded.
- **CLAUDE.md** "Running" section filled in.

### Notes
- No application logic beyond the dashboard cards. Phase 2 wires the
  couple/wedding-project tables and the create-couple wizard.

## [Unreleased] — Phase 0

### Added
- Repository reorganised into a pnpm + Turborepo monorepo (`apps/`,
  `packages/`, `prompts/`, `tools/`, `samples/`, `docs/`,
  `.claude/skills/`, `.github/workflows/`).
- `prompts/00-context-company.md` and the five existing prompt files
  moved into `prompts/` with `git mv` so history is preserved.
- HTML prototypes archived under `tools/`.
- Sham & Shwan reference timeline placed under `samples/sham-shwan/`.
- Top-level `README.md`, `CLAUDE.md`, `package.json`,
  `pnpm-workspace.yaml`, `turbo.json`, `vercel.json`, `.gitignore`.
- Specifications under `docs/`:
  - `PRD.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `RBAC.md`
  - `AI-AGENTS.md`, `MASTER-AI.md`, `INTEGRATIONS.md`, `WHATSAPP.md`
  - `PROMPT-AUTHORING.md`
  - `HINDU-SIKH-CHECKLIST.md`, `JEWISH-CHECKLIST.md`
  - `I18N.md`, `GDPR.md`, `SECURITY.md`, `PHOTO-CONSENT.md`,
    `CONFLICT-OF-INTEREST.md`
  - `FILE-NAMING.md`, `EXPORTS.md`, `RUNBOOK.md`,
    `PLANNER-ONBOARDING.md`, `ROADMAP.md`, `CHANGELOG.md`
- ADRs: 0001-stack, 0002-prompt-caching, 0003-rls-strategy,
  0004-html-tool-coexistence, 0005-master-ai-multi-front,
  0006-per-planner-private-conversations.
- Missing prompt files added: `hindu-sikh-ceremony-check.md`,
  `jewish-ceremony-check.md`, `options-comparison.md`,
  `initial-proposal.md`, `contract-draft.md`, `visit-agenda.md`,
  `budget-update.md`, `weekly-status-email.md`.
- Ten Claude Code skills under `.claude/skills/`.

### Notes
- No application code yet. Phase 1 begins after Phase 0 sign-off.
