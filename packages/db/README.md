# @crystal/db

Supabase migrations + generated types + zod schemas.

## Layout

```
migrations/      timestamped SQL migrations applied via Supabase CLI
src/types/       supabase-generated TS types (regenerate via `pnpm codegen`)
src/zod/         hand-authored zod schemas per table
src/index.ts     barrel
scripts/         maintenance scripts (key rotation, retention sweeps)
```

## Adding a new migration

Filename: `<yyyyMMddHHmmss>_<slug>.sql`. Template lives in
`.claude/skills/crystal-data-modeller`. Every table needs:
`id`, `public_id`, `created_at`, `updated_at`, `created_by`, RLS
enabled, at least one policy, and an updated zod schema in
`src/zod/<table>.ts`.

After applying the migration locally:

```sh
pnpm --filter db codegen
```

regenerates `src/types/database.ts`.

## Phase 1 contents

- `20260504000000_init_extensions.sql` — `pgcrypto`, `uuid-ossp`,
  `tg_set_updated_at()` trigger function.
- `20260504000100_org_team_member.sql` — `org`, `team_member`, the
  planner allow-list trigger, and `auth.uid_team_member()` helper.

Couple, project, budget, comm log, document, AI, integrations tables
arrive in Phases 2 onwards.
