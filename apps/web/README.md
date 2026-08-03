# web

Next.js 15 planner workspace. Phase 1 ships the scaffold:

- Tailwind with brand tokens from `@crystal/ui`
- Supabase Auth wiring (Google SSO + magic-link fallback)
- Planner allow-list enforced at the DB layer (see
  `packages/db/migrations/20260504000100_org_team_member.sql`)
- Middleware that gates every workspace route behind a session
- A bare dashboard listing what's coming in later phases

## Local run

```sh
cp .env.example .env.local
# fill in Supabase URL + anon key
pnpm install
pnpm --filter web dev
```

## Routes

| Path | What |
|---|---|
| `/login` | Google SSO + magic-link form |
| `/auth/callback` | Supabase OAuth code exchange |
| `/auth/signout` | POST endpoint to end the session |
| `/` | Dashboard placeholder (workspace) |
| `/health` | Edge JSON health check |
