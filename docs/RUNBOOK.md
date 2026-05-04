# Runbook

Operational playbook for the on-call planner (Jennifer by default,
Núria as backup) and any engineering helper.

## Daily checks (auto-cron)

| Job | Schedule | Failure → |
|---|---|---|
| OAuth health (mailbox + calendar) | 06:00 Madrid | Notify owner via in-app + WhatsApp |
| FX refresh | 04:00 UTC | Last snapshot used; banner in budget UI |
| Wedding-day digest | T-2h on each wedding | Retry every 5 min for 30 min; then page Jennifer |
| Storage retention sweep | 02:00 daily | Notify owner; do not delete on uncertainty |
| Backup verification (Supabase PITR) | weekly | Notify owner |

## Restore from backup

Supabase PITR (Point-In-Time Recovery) is enabled (Pro plan, 7-day
window). To restore:

1. From Supabase dashboard → Backups → choose timestamp.
2. Restore to a **new project**, never overwrite production.
3. Validate: log in as Jennifer, browse 3 most-recent weddings, run
   `select count(*) from agent_message;` — compare to last known good.
4. Migrate any post-restore deltas manually if needed.
5. Promote the restored project (re-point Vercel env vars) — only after
   sign-off from Jennifer.

## Key rotation

### Anthropic API key

1. Generate new key in Anthropic Console.
2. Add as `ANTHROPIC_API_KEY_NEXT` in Vercel env.
3. Deploy a build that prefers `_NEXT` if present.
4. Monitor `ai_run` for 24h; ensure no errors with the new key.
5. Promote: rename `_NEXT` → primary, delete the old key in console.

### `pgcrypto` symmetric key (every 2 years)

This is the most invasive rotation.

1. Schedule a maintenance window (2h, off-hours).
2. Add new key to Supabase Vault as `pgcrypto_key_v<n+1>`.
3. Run the re-encryption job (`packages/db/scripts/rotate-pgp-key.sql`)
   in batches of 1000 rows; log progress.
4. Verify a sample of decryptions succeed with the new key.
5. Remove the old key from Vault.
6. Audit log entry recording the rotation.

### Meta WhatsApp permanent token

Meta auto-expires periodically. When notified:

1. Create new system user / token in Meta Business Manager.
2. Update `WHATSAPP_TOKEN` in Vercel env.
3. Send a test inbound from Jennifer's phone; verify it lands.
4. Old token revoked automatically by expiry.

## Re-running a failed AI job

`ai_run` rows with `status='failed'` accumulate. To retry:

```sql
update ai_run
set status = 'queued'
where id = <id>;
```

The queue worker picks it up. If it fails again, inspect the input in
`agent_message` (for Master AI) or the feature agent's recorded input
in the `ai_run.payload` column.

## Common incidents

### "AI is replying with stale data"

- Check `prompts/00-context-company.md` was last edited recently —
  the prompt cache key is derived from its hash; an edit invalidates the
  cache and the next call is full-cost. Wait 1 minute and retry.

### "WhatsApp inbound stopped"

- Meta dashboard → Webhook → check delivery status.
- Most common cause: a 5xx from our webhook caused Meta to back off;
  check Sentry, fix, re-subscribe.

### "Planner can't see their conversation in the workspace"

- Their `team_member.auth_user_id` may not match the email they signed
  in with. Confirm Google SSO email matches `team_member.email`.

### "Provider RFQ leaked a surname"

P0 incident. Steps:

1. Recall the email if Gmail/M365 supports (within minutes only).
2. Identify the leak path: which feature agent produced it? Which run?
   `ai_run` has the input + output.
3. Add a fixture to the PII-leakage eval set with that exact pattern.
4. Update prompt + post-generation regex.
5. Notify Jennifer; she decides on provider notification.
6. Post-mortem in `docs/RUNBOOK-archive/<date>.md`.

## Logs & dashboards

- **Sentry**: errors, with PII scrubbed.
- **Vercel Analytics**: response times.
- **PostHog**: planner activity (PII-stripped).
- **Supabase logs**: SQL slow queries, auth events.
- **`/admin/ai-bill`** (in-app): cost per planner per week.

## Escalation

| Severity | Owner | Backup |
|---|---|---|
| P0 (data leak / outage) | Jennifer | Núria |
| P1 (degraded AI / WhatsApp) | Jennifer | Núria |
| P2 (cosmetic / non-blocking) | normal PR cycle | n/a |

## Maintenance windows

Avoid:
- Friday 14:00 → Sunday 23:00 Madrid time during wedding season
  (May–October), since most weddings occur Saturday.
- Wednesday 10:00–13:00 Madrid time (the team's weekly sync).

Good times: Monday or Tuesday morning Madrid time.
