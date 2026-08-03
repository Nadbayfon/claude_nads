---
name: crystal-data-modeller
description: Authors Supabase migrations, RLS policies, and zod types from a feature description. Enforces house rules (id/public_id/timestamps/RLS on every table; pgcrypto for sensitive columns; service-role-key restrictions). Use when adding or modifying any database object.
---

# crystal-data-modeller

## When to invoke

- New table, column, view, or trigger.
- New RLS policy or update to an existing one.
- New `SECURITY DEFINER` function for decryption.
- Generating zod types from updated schema.

## House rules (enforced)

Every table:

```sql
create table public.<name> (
  id           bigserial primary key,
  public_id    uuid not null default gen_random_uuid() unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  -- ... domain columns
);

create trigger trg_<name>_updated_at
before update on public.<name>
for each row execute function public.tg_set_updated_at();

alter table public.<name> enable row level security;
-- + at least one policy
```

Sensitive columns (passport, IBAN, surname, OAuth tokens) are
`bytea` encrypted with `pgcrypto pgp_sym_encrypt`. Decryption only
inside `SECURITY DEFINER` functions that check the calling role.

Money columns: `numeric(14,2)`. Never `float`.

Time columns: `timestamptz`. Never `timestamp` without time zone.

Soft delete: `deleted_at timestamptz`. RLS hides
`deleted_at IS NOT NULL` rows by default.

## RLS templates

### Owner-scoped

```sql
create policy <table>_owner_select
on public.<table> for select
using (created_by = auth.uid());
```

### Wedding-scoped (planner assigned)

```sql
create policy <table>_wedding_select
on public.<table> for select
using (
  exists (
    select 1 from public.wedding_project wp
    where wp.id = <table>.wedding_project_id
      and auth.is_assigned(wp)
      and wp.deleted_at is null
  )
);
```

### Per-planner private (Master AI conversations)

```sql
create policy agent_conversation_owner_or_shared
on public.agent_conversation for select
using (
  owner_team_member_id = auth.uid_team_member()
  or (
    is_shared_to_team = true
    and exists (
      select 1 from public.wedding_project wp
      where wp.id = wedding_project_id
        and auth.is_assigned(wp)
    )
  )
);
```

### Service role only (audit, telemetry)

```sql
-- no policies; only service-role key writes; selects via SECURITY DEFINER fn
revoke all on public.<table> from authenticated;
```

## Migration template

`packages/db/migrations/<timestamp>_<slug>.sql`:

```sql
-- migration: <slug>
-- depends on: <previous migration filename>

-- 1. Schema
...

-- 2. Triggers
...

-- 3. RLS
...

-- 4. Indexes that match policy predicates
create index <table>_wedding_project_id_idx
  on public.<table> (wedding_project_id);
```

## Lint checks

The skill runs (or generates checks for) the following before commit:

- [ ] Table has `id`, `public_id`, `created_at`, `updated_at`,
      `created_by`.
- [ ] Table has `enable row level security` and at least one policy.
- [ ] No `public.<table>.surname*` / `iban` / `passport` columns
      stored in plaintext.
- [ ] No bare `service_role_key` reference outside `/api/cron`,
      `/api/(whatsapp|email|calendar)/inbound`, or
      `packages/db/scripts/*`.
- [ ] Money columns are `numeric(14,2)`.
- [ ] Time columns are `timestamptz`.
- [ ] Index exists for every column used in an RLS policy predicate.

## zod types

After every migration, regenerate types:

```sh
pnpm --filter db run codegen
```

This emits:

- `packages/db/src/types/database.ts` (Supabase generated)
- `packages/db/src/zod/<table>.ts` (one zod schema per table)

## SECURITY DEFINER functions

Template for decryption:

```sql
create or replace function public.fn_decrypt_couple_surname(p_couple_id bigint)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_assigned boolean;
  v_cipher bytea;
begin
  -- caller role check
  select role into v_role from public.team_member
   where auth_user_id = auth.uid();
  if v_role not in ('owner', 'planner') then
    raise exception 'role not allowed';
  end if;

  -- assignment check (skip for owner)
  if v_role = 'planner' then
    select exists (
      select 1 from public.wedding_project wp
      join public.couple c on c.id = wp.couple_id
      where c.id = p_couple_id and auth.is_assigned(wp)
    ) into v_assigned;
    if not v_assigned then
      raise exception 'not assigned to this wedding';
    end if;
  end if;

  select surnames_confidential into v_cipher
    from public.couple where id = p_couple_id;
  return pgp_sym_decrypt(v_cipher, current_setting('app.pgcrypto_key'));
end $$;
```

## Don't

- Don't add a column without a policy update if RLS depends on it.
- Don't use `auth.uid()` directly in policies — use the helpers
  `auth.uid_team_member()` / `auth.is_assigned(wp)`.
- Don't call `pgp_sym_decrypt` outside a `SECURITY DEFINER` function.
- Don't ship a migration without an accompanying RLS test (see
  `packages/db/tests/rls/`).
