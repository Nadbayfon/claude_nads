# SETUP — publishing the Crystal Events app

> **Target audience:** Jennifer (and anyone else with the GitHub repo).
> **Time to first deploy:** ~45 minutes.
> **What you'll have at the end:** A live app on a `*.vercel.app` URL,
> signed in as Jennifer, with the Couples and Budgets module working.

This guide ships **Phase 1–3** (auth + couples + projects + events + tree
budget with VAT / milestones / JSON round-trip). Phases 4–8 (Master AI,
email, WhatsApp, calendar, day-of, PWA) come later and have their own
setup sections.

---

## Prerequisites (5 min)

You'll need accounts at:

1. **Supabase** — <https://supabase.com> (free tier is fine; pick **EU region**).
2. **Vercel** — <https://vercel.com> (free Hobby tier works).
3. **Google Cloud Console** — <https://console.cloud.google.com> (for Google sign-in).

You can use Google sign-in for all three.

You'll also need:

- The GitHub repo `nadbayfon/claude_nads` connected to your GitHub account.
- ~45 minutes of uninterrupted time (most of it is waiting for Vercel deploys).

---

## Step 1 — Create the Supabase project (5 min)

1. Sign in to <https://supabase.com> → **New project**.
2. **Name:** `crystal-events` (or whatever you like).
3. **Region:** choose **West EU (London)** or **Central EU (Frankfurt)** — GDPR-relevant.
4. **Database password:** generate a strong one and store it in 1Password / your manager. Supabase shows it once.
5. Click **Create new project** and wait ~2 minutes.

**Copy these three values to a scratch pad** — you'll paste them into Vercel later:

- **Project URL** → Settings → Data API → "Project URL"
  Example: `https://abcdefg.supabase.co`
- **anon (public) key** → Settings → Data API → "anon public"
  This is safe to expose in browser bundles.
- **service_role key** → Settings → Data API → "service_role"
  ⚠️ **Never** commit this to git. Only used in server-side code.

---

## Step 2 — Apply the database migrations (10 min)

Two options. Pick A if you want to avoid installing CLI tools.

### Option A — Paste into the Supabase SQL editor (no install)

1. In the Supabase dashboard → **SQL Editor** (left sidebar) → **New query**.
2. Run these files **in order** (open each file in GitHub, copy contents, paste into SQL Editor, click **Run**):
   1. `packages/db/migrations/20260504000000_init_extensions.sql`
   2. `packages/db/migrations/20260504000100_org_team_member.sql`
   3. `packages/db/migrations/20260504000200_couple_project_event.sql`
   4. `packages/db/migrations/20260504000300_budget.sql`
3. Each one should succeed with "Success. No rows returned" (or similar).

### Option B — Use the Supabase CLI

```sh
brew install supabase/tap/supabase     # or: npm i -g supabase
cd path/to/claude_nads
supabase login
supabase link --project-ref <your-project-ref>   # the ref is in your project URL
supabase db push
```

### Verify

In the Supabase dashboard → **Table Editor** → you should see:
`org`, `team_member`, `couple`, `wedding_project`, `event`, `provider`,
`budget_service`, `budget_provider_option`, `budget_line_item`,
`payment_milestone`, `budget_version`, `currency_fx_snapshot`.

Click `team_member` — you should see **one row: Jennifer May, owner**.

---

## Step 3 — Configure Supabase Auth (5 min)

### 3a. Google OAuth provider

1. **Google Cloud Console** → create a project (or reuse).
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
3. **Application type:** Web application.
4. **Authorised redirect URIs:** add `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   (you'll find the exact URL in Supabase → Authentication → Providers → Google → "Callback URL (for OAuth)").
5. Click **Create** — Google shows you a **Client ID** and **Client secret**.
6. Back in Supabase → **Authentication → Providers → Google** → toggle ON,
   paste the Client ID and Client secret → **Save**.

### 3b. Site URL

Supabase → **Authentication → URL Configuration**:

- **Site URL:** leave blank for now — you'll fill it in after Step 4 with your Vercel URL.

### 3c. Email allow-list

Already enforced by the migration trigger `trg_auth_users_allow_list`. Anyone
trying to sign in with an email that isn't in `team_member` gets a clear
"Email is not on the planner allow-list" error.

---

## Step 4 — Deploy to Vercel (10 min)

1. Sign in to <https://vercel.com> → **Add New → Project**.
2. Choose **Import Git Repository** → select `nadbayfon/claude_nads`.
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** click **Edit** → set to `apps/web`.
5. **Build Command:** leave default (`next build`).
6. **Environment Variables** — add these three before deploying:

   | Name                              | Value                                              | Scope                         |
   |-----------------------------------|----------------------------------------------------|-------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`        | from Step 1                                        | Production, Preview, Dev      |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | from Step 1                                        | Production, Preview, Dev      |
   | `SUPABASE_SERVICE_ROLE_KEY`       | from Step 1                                        | Production only (safer)       |

7. Click **Deploy**. First build takes ~3 minutes.
8. When done, Vercel shows your URL: `https://claude-nads-<hash>.vercel.app`.

### Tell Supabase about the URL

Go back to Supabase → **Authentication → URL Configuration**:

- **Site URL:** paste your Vercel URL (e.g. `https://claude-nads-<hash>.vercel.app`).
- **Redirect URLs:** add `https://claude-nads-<hash>.vercel.app/auth/callback`.
- Click **Save**.

---

## Step 5 — Sign in as Jennifer (2 min)

1. Open the Vercel URL in a browser.
2. You should land on `/login` with a **Continue with Google** button.
3. Click it. Sign in with `jennifer@crystalevents.eu`.
   - First time: Google asks for permission to share email + name. Allow.
   - Supabase creates the auth user; the trigger links it to the `team_member` row.
4. You should be redirected to `/` with:
   - "Crystal Events" in the header
   - "Jennifer May · owner" on the right
   - Dashboard tiles for Couples, Budgets, Master AI…
5. Click **Couples** in the nav → empty state.
6. Click **+ New couple** → fill in the form → submit. You should see the new couple in the list.
7. Open the couple → click **Budget →** → add a service, a provider, a line item.

---

## Step 6 — (Optional) Load the Sham & Shwan demo data

Useful for showing the app to others without typing data.

1. Supabase → **SQL Editor** → **New query**.
2. Paste contents of `packages/db/seeds/sham_shwan.sql`.
3. Click **Run**.
4. Reload your Vercel app → **Couples** → you should see **Sham & Shwan**
   with 5 events (Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception).

---

## Step 7 — Verify security (3 min)

Before you start putting real couple data in:

1. **RLS is on every table.** Open Supabase → Table Editor → click any
   table → **Policies** tab → you should see at least one policy. If any
   table shows "No policies", **don't insert real data** — open a GitHub
   issue.

2. **Test the allow-list works.** Sign out (header → "Sign out"), then
   try **Continue with Google** in an incognito window with a non-allowlisted
   email. You should get **"Email is not on the planner allow-list"** and
   stay on `/login`.

3. **Service-role key is server-only.** In your browser DevTools →
   Application → Cookies/Storage, search for the service-role key.
   It should be nowhere. (If it appears, stop and open an issue.)

4. **Read [docs/SECURITY-PHASE-3.md](./SECURITY-PHASE-3.md)** for the
   data-isolation guarantees in this Phase 3 release.

---

## What's not in this release

- No Master AI chat (Phase 3.5)
- No email integration (Phase 4)
- No WhatsApp (Phase 6)
- No calendar sync (Phase 6.5)
- No day-of timeline export (Phase 7)
- No PWA / offline mode (Phase 8)
- No team-member management UI yet — adding Núria, Róisín, Jackie requires
  another row in `team_member` via SQL Editor:
  ```sql
  insert into public.team_member (org_id, display_name, email, role)
  values ((select id from public.org limit 1), 'Núria Font', 'nuria@crystalevents.eu', 'planner');
  ```

When you're ready for the next phase, the codebase is set up to deliver
them incrementally — see `docs/ROADMAP.md`.

---

## Troubleshooting

### "Email is not on the planner allow-list" but Jennifer's email *is* in the team

Check that the email is **lowercase** in the database. The trigger does a
`lower(email)` compare, so casing should be safe — but if you inserted the
row through the dashboard it may have unexpected whitespace. Run:

```sql
select id, email from public.team_member where email ilike '%jennifer%';
```

### Magic-link emails not arriving

Supabase Authentication → Email Templates → check the SMTP settings are
configured. The free Supabase plan uses a limited shared SMTP and may
rate-limit. Set up Resend / Postmark SMTP credentials in Settings → Auth
→ SMTP Settings before going to real use.

### "Could not find this couple" when opening `/couples/[id]`

You're hitting an RLS policy that filtered out the row. Run as the same
user in SQL Editor:

```sql
select * from public.couple where public_id = '<paste-from-url>';
```

If you get a result here but not in the app, the issue is in the policy —
open a GitHub issue with the policy name.

### Build fails on Vercel with "Cannot find module @crystal/db"

Vercel didn't install the monorepo workspaces. Check that **Root Directory**
is set to `apps/web` (not `apps/web/.` or `/`) and that the **install command**
is auto-detected to `pnpm install` (Vercel reads `pnpm-workspace.yaml`).

---

## Updating to a new release

When new code is merged to `main`, Vercel auto-deploys. If the release
includes database migrations, you'll see a note in the PR description
("Adds migration `0500_...`"). Apply it via Step 2 before merging.

---

## Backup and recovery

Supabase takes automatic daily backups on paid plans. On free tier, take
manual snapshots before each migration:

```sh
supabase db dump --schema public > backups/$(date +%Y%m%d).sql
```

Store backups outside the repo (S3, Google Drive, anything except the
public GitHub repo).
