# Security — Phase 3 published release

This document describes the data-isolation guarantees in the **published
Phase 3 release** (auth + couples + projects + events + budgets). It is
narrower than `docs/SECURITY.md`, which covers the full plan including
phases not yet shipped.

Reading this should take about 5 minutes. It exists so Jennifer (and any
external reviewer) can audit what data is exposed to whom.

---

## What's in scope

**Persisted data (Supabase Postgres):**

- `org`, `team_member` — Crystal Events org + Jennifer's row
- `couple` — couple display name, partner names (plain text in this
  phase), nationality, primary email/phone, photo-consent level, GDPR
  consent timestamp, notes
- `wedding_project` — wedding name, date, status, guest counts, budget
  range, ceremony flags (Hindu/Sikh, Jewish, civil), venue, planner
  links, notes
- `event` — sub-event name + kind + phase + time + venue + guest count
- `provider` — provider directory (legal/trade name, category, email,
  phone, website, languages, dietary, Hindu/Sikh experience, Jewish
  experience, COI flag)
- `budget_service`, `budget_provider_option`, `budget_line_item`,
  `payment_milestone`, `budget_version`
- `currency_fx_snapshot`

**Surfaces:**

- The Next.js workspace at `https://<your>.vercel.app` (planner-only)
- The JSON export route `GET /couples/[id]/budget/export.json`
- No couple-facing surfaces (no portal yet)
- No provider-facing surfaces (no RFQ yet)
- No AI calls (Master AI / translate-proposal ship in Phase 3.5+)

---

## Trust boundaries

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (planner)                                           │
│  • Holds Supabase session cookie                             │
│  • Holds NEXT_PUBLIC_SUPABASE_ANON_KEY (safe to expose)      │
│  • No service_role key. Ever.                                │
└──────────────────────────────────────────────────────────────┘
                  │ HTTPS · Supabase auth cookie
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  Next.js server (Vercel)                                     │
│  • Holds NEXT_PUBLIC_SUPABASE_URL + ANON_KEY                 │
│  • Holds SUPABASE_SERVICE_ROLE_KEY (Vercel env, server only) │
│  • Server actions run with the planner's session             │
│  • Service-role NOT used by any route in this release        │
└──────────────────────────────────────────────────────────────┘
                  │ HTTPS · session JWT
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase Postgres                                           │
│  • RLS on every public table                                 │
│  • auth.uid_team_member() resolves planner → team_member row │
│  • Allow-list trigger on auth.users rejects non-allowlisted  │
│    emails before they create a session                       │
└──────────────────────────────────────────────────────────────┘
```

**Key invariant:** every read or write goes through RLS. The service-role
key is not used in any code path shipping in Phase 3. The browser only
ever holds the anon key, which on its own cannot read or write any
sensitive data because RLS requires an authenticated session.

---

## Row-level security policies

Every table has `enable row level security` and at least one explicit
policy. Audit them in Supabase → Table Editor → click any table →
**Policies** tab.

Summary:

| Table | Read policy | Write policy |
|-------|-------------|--------------|
| `org` | authenticated users, all rows | none (DB-only inserts) |
| `team_member` | authenticated users, non-deleted | self-update only |
| `couple` | authenticated users, non-deleted | lead planner / owner / admin |
| `wedding_project` | authenticated users, non-deleted | lead/secondary planner / owner / admin |
| `event` | authenticated users | inserts gated by project org + planner role |
| `provider` | authenticated users, non-deleted | same-org members only |
| `budget_service` | authenticated users | lead/secondary planner / owner / admin (via project) |
| `budget_provider_option` | authenticated users | same |
| `budget_line_item` | authenticated users | same |
| `payment_milestone` | authenticated users | same |
| `budget_version` | authenticated users | same |
| `currency_fx_snapshot` | authenticated users | none (would be cron / service-role in a later phase) |

Since this release has only one team member (Jennifer, role `owner`),
the practical effect is: **only Jennifer can read or write anything**.

When you add Núria, Róisín, or Jackie, they will see all couples and
projects (read), but only owners (Jennifer) and admins can edit couples
they aren't leading. This matches the plan's RBAC.

---

## No knowledge-base leakage

The "knowledge base" is everything under `prompts/` in the repo:

- `prompts/00-context-company.md` — master context including planner
  names, internal tone, COI rules, what we don't do, etc.
- All other `prompts/*.md` — feature-specific instructions.

These files are loaded **server-side only**, and **only when AI features
are wired up** (Phase 3.5+).

### In this release (Phase 3)

There are zero AI calls. The prompts directory is not loaded at runtime.
**It is impossible for knowledge-base content to leak to couples or
providers in this release**, because no provider-facing or
couple-facing output is produced — every surface is planner-facing.

### When AI ships (Phase 3.5+)

The plan enforces this via three layered checks:

1. **System prompt** (`packages/ai/src/system-prompt.ts`) tells the model
   never to reveal internal context.
2. **Per-feature output schemas** (zod) constrain what the model can
   return. A schema that produces "RFQ email body in Catalan" cannot
   carry an arbitrary excerpt of `00-context-company.md`.
3. **PII-leakage post-check** (`crystal-gdpr-reviewer` skill +
   `packages/ai/evals/`) regex-scans every provider-facing output for
   couple surnames and budget figures before persisting. CI fails the
   build if the eval catches anything.

These three checks are designed for the AI phases. Until Phase 3.5
ships, the surface area for leakage is zero.

---

## Sensitive data handling — current vs target

Phase 3 ships with **plain-text storage** of:

- `couple.partner1_full_name`, `couple.partner2_full_name`
- `couple.email_primary`, `couple.phone_primary_e164`
- `couple.notes`, `wedding_project.notes`, `event.notes`

The target (Phase 8) wraps these in `pgcrypto`:

```sql
alter table public.couple
  alter column partner1_full_name type bytea using pgp_sym_encrypt(...);
```

**Recommendation while we're in Phase 3:** don't store passport / IBAN /
ID numbers anywhere in the app. The `couple.notes` field is suitable for
"Both vegetarian; planning ~280 guests" but not for "Passport
GB123456789". The Phase 8 hardening will add columns specifically for
identity documents with `pgcrypto` from the start.

---

## Audit checklist before letting non-Jennifer planners in

When you're ready to add Núria / Róisín / Jackie:

- [ ] Confirm RLS still enabled on all tables (one-line check):
      ```sql
      select schemaname, tablename, rowsecurity
        from pg_tables
       where schemaname = 'public' and rowsecurity = false;
      ```
      Should return **zero rows**.

- [ ] Confirm the allow-list trigger is still attached:
      ```sql
      select tgname from pg_trigger where tgname = 'trg_auth_users_allow_list';
      ```
      Should return **one row**.

- [ ] Send each new planner the Vercel URL. They sign in with their
      Google account. If their email isn't in `team_member`, they
      cannot sign in.

- [ ] Test that Róisín (`stylist` role) can read everything but cannot
      edit a project where she isn't the lead/secondary planner.

---

## Incident response

If you suspect a credential is leaked (anon key shown to a couple,
Vercel build log posted publicly, etc.):

1. **Rotate the anon key.** Supabase → Settings → API → **Generate new
   anon key**. Update the Vercel env var.
2. **Re-deploy.** Vercel → redeploy production.
3. **Rotate the service-role key** if it might be exposed. Same path.
4. **Invalidate sessions.** Supabase → Authentication → Users → for each
   user → **Sign out everywhere**.

For couple data leaks (a provider sees a couple's contact info, a
photo appears online without consent):

1. Document the leak (date, scope, who saw what) — this informs GDPR
   breach notification within 72h.
2. Remove the affected data from any external surface.
3. Open a GitHub issue tagged `security` for the code change preventing
   recurrence.
