# ADR 0003 — Row-level security strategy

**Status:** Accepted (Phase 0)
**Date:** 2026-05-04

## Context

Crystal Events handles couple PII, provider commercial data, and
per-planner private AI conversations. Authorisation must be enforced
at the database boundary — not only in application code — so that
bugs in route handlers can't accidentally expose data, and so that
direct Supabase access (Storage signed URLs, Realtime channels)
inherits the same rules.

## Decision

- **RLS on every table.** Default policy is "deny all".
- **Helper functions** `auth.uid_team_member()` and
  `auth.is_assigned(wp)` (see `docs/RBAC.md`) are the building
  blocks; policies compose them rather than duplicating logic.
- **Service role key is forbidden in user-triggered code paths.**
  It's only used in:
  - `/api/cron/*` background jobs
  - `/api/whatsapp/inbound`, `/api/email/inbound`,
    `/api/calendar/*` (webhook handlers)
  - Supabase migrations
  A CI lint scans the repo for `SUPABASE_SERVICE_ROLE_KEY` references
  outside those paths.
- **Master AI tools** receive a Supabase client built from the
  planner's session. RLS denials inside a tool are surfaced as a
  structured `denied_by_rls` result, never as an exception that the
  AI re-paraphrases.
- **`SECURITY DEFINER` functions** are the only path to decrypt
  sensitive columns. They check the calling role; we add unit tests
  for each definer function asserting the role-check.
- **Soft delete via `deleted_at`** for `couple`, `wedding_project`,
  `provider`, `agent_conversation`. RLS hides
  `deleted_at IS NOT NULL` rows by default; the owner role can opt
  in to "show archived" via a request parameter.

## Alternatives considered

- **Application-level authorisation only** — rejected; one missed
  middleware check is one PII leak. RLS is the safety net.
- **Schema-per-org** — rejected for v1; we have one org. May revisit
  for a multi-org v2.
- **Postgres ROW SECURITY with a separate `current_planner_id`
  GUC** — rejected; Supabase Auth handles JWT propagation cleanly,
  and GUCs add a foot-gun.

## Consequences

- RLS policy authoring is non-trivial. The `crystal-data-modeller`
  skill bundles a template + lint rules so every new table gets a
  policy.
- Performance: RLS adds predicate pushdown costs; we monitor slow
  queries via Supabase logs and add indexes that match policy
  predicates (`(lead_planner_id, deleted_at)`, etc.).
- Tooling: tests must run with the planner's JWT, not the service
  key. We use Supabase test helpers + a sample of three planner
  identities.
- Master AI behavioural impact: tools may legitimately fail with
  `denied_by_rls` (e.g. Núria asks about Jennifer-only wedding).
  Dialog evals cover the polite-refusal path explicitly.
