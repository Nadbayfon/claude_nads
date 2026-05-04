# Changelog

All notable changes to the Crystal Events app are recorded here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
