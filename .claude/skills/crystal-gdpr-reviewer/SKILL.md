---
name: crystal-gdpr-reviewer
description: Audits PRs and migrations for PII handling. Flags new columns that look like personal data, checks they appear in docs/GDPR.md, verifies retention, and confirms zero-retention headers on Anthropic calls that may contain PII. Use proactively on every PR that touches the data model, AI agents, integrations, or storage.
---

# crystal-gdpr-reviewer

## When to invoke

- Any PR touching `packages/db/migrations/*`.
- Any PR adding/modifying a feature agent
  (`apps/web/server/ai/*.ts`).
- Any PR touching `apps/web/app/api/(whatsapp|email|calendar)/*`.
- Any PR touching Storage upload paths or retention sweeps.
- Periodic full-repo audit (quarterly).

## What to check

### 1. New PII-looking columns

Regex set:

```
\bsurname
\bpassport
\bid_card
\biban
\bbic\b
\bpassport_number
\bdate_of_birth
\bdob\b
\bnif\b
\bnie\b
\btax_id
\baddress
```

For each match in a migration:

- [ ] Does the column use `bytea` + `pgcrypto` if it's truly
      sensitive (passport, IBAN, surname)?
- [ ] Is it documented in `docs/GDPR.md` (data map table)?
- [ ] Is retention specified?
- [ ] Are RLS policies tightened (encrypted columns require
      `SECURITY DEFINER` decryption)?

### 2. Anthropic zero-retention header

Scan every `anthropic.messages.create` call site. For each:

- [ ] Does the agent module set `mayContainPII: true`?
- [ ] Does the model router include the
      `anthropic-beta: zero-retention-2024-01-01` header when
      `mayContainPII` is true?

The `crystal-ai-agent-dev` skill scaffolds this correctly; this
check catches drift.

### 3. Sub-processor list

If the PR introduces a new external API call:

- [ ] Is the provider in `docs/GDPR.md`'s sub-processor table?
- [ ] Is the DPA signed and noted?
- [ ] Is the data flow documented in `docs/INTEGRATIONS.md`?

### 4. Retention sweeps

For new persisted data:

- [ ] Is there a sweep job in `apps/web/app/api/cron/retention/route.ts`?
- [ ] Does the retention duration match `docs/GDPR.md`?
  - Couple PII: 30 days post-wedding (anonymise)
  - Passport scans: 30 days post-wedding (delete)
  - Comm bodies: 30 days post-wedding (purge body, keep audit metadata)
  - Voice notes: 90 days post-wedding (delete)
  - `agent_message`: 30 days post-wedding (purge)
  - `ai_run`: 13 months
  - Finance / IBAN: 6 years (Spanish tax law)

### 5. Service-role key usage

```
grep -r "SUPABASE_SERVICE_ROLE_KEY" apps/web/ packages/
```

Allowed paths:

- `apps/web/app/api/cron/*`
- `apps/web/app/api/(whatsapp|email|calendar)/inbound/route.ts`
- `packages/db/scripts/*`

Anywhere else → block the PR.

### 6. Sentry / PostHog scrubbing

- Sentry `beforeSend` strips fields matching
  `/passport|iban|surname|oauth_token|api_key|app_secret/i`.
- PostHog events explicitly allowlist properties; blocklist couple
  display names, provider names, and any free-text fields.

### 7. Master AI conversation privacy

- Tools that return data from `agent_conversation` /
  `agent_message` filter by
  `owner_team_member_id = auth.uid_team_member()` unless
  `is_shared_to_team = true` AND requester is assigned to the
  linked wedding.
- Cross-planner privacy eval (`packages/ai/evals/master-ai/wrong-planner-cant-see.json`)
  is unmodified or extended (never weakened).

## Output

The skill produces a comment on the PR:

```markdown
### GDPR review — automated

| Check | Status | Notes |
|---|---|---|
| New PII columns | ✅ / ⚠️ / ❌ | ... |
| Zero-retention headers | ✅ / ⚠️ / ❌ | ... |
| Sub-processors documented | ✅ | n/a |
| Retention sweeps | ✅ / ⚠️ / ❌ | ... |
| Service-role key scope | ✅ | n/a |
| Sentry / PostHog scrubbing | ✅ | n/a |
| Master AI privacy filters | ✅ | n/a |

[List of issues found, with file:line references.]
```

`⚠️` = needs human attention; `❌` = must fix before merge.

## Don't

- Don't approve a PR with a `❌` open.
- Don't accept "we'll add the retention sweep later" — file an
  issue immediately and link it from the PR.
- Don't relax the cross-planner privacy filters without an ADR
  amendment to ADR-0006.
