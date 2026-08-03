#!/usr/bin/env bash
# One-shot deployment of the Crystal Events Phase 3 release.
#
# Usage:
#   SUPABASE_TOKEN=sbp_... VERCEL_TOKEN=... ./scripts/deploy.sh
#
# What it does (idempotent where possible):
#   1. Creates a Supabase project in eu-central-1 (Frankfurt), or reuses one
#      named "crystal-events" if it already exists
#   2. Applies packages/db/scripts/all-migrations.sql via the Management API
#   3. Verifies RLS is enabled on every public table
#   4. Deploys apps/web to Vercel production via the Vercel CLI
#   5. Sets the 3 env vars on the Vercel project
#   6. Points Supabase auth (site_url + redirect allow-list) at the live URL
#   7. Smoke-tests /health and /login on the live URL
#
# Requirements: bash, curl, jq, node/npx (for the Vercel CLI). No global
# installs — the Vercel CLI runs via npx.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="${PROJECT_NAME:-crystal-events}"
SUPABASE_REGION="${SUPABASE_REGION:-eu-central-1}"
SB_API="https://api.supabase.com"

: "${SUPABASE_TOKEN:?Set SUPABASE_TOKEN (sbp_... from supabase.com/dashboard/account/tokens)}"
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN (from vercel.com/account/settings/tokens)}"

command -v jq >/dev/null || { echo "jq is required"; exit 1; }
command -v curl >/dev/null || { echo "curl is required"; exit 1; }
command -v npx >/dev/null || { echo "node/npx is required"; exit 1; }

sb() { # sb METHOD PATH [JSON_BODY]
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$SB_API$path" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -X "$method" "$SB_API$path" \
      -H "Authorization: Bearer $SUPABASE_TOKEN"
  fi
}

echo "==> 1/7 Supabase project"

EXISTING=$(sb GET /v1/projects | jq -r --arg n "$PROJECT_NAME" '.[] | select(.name == $n) | .id' | head -1)

if [ -n "$EXISTING" ]; then
  PROJECT_REF="$EXISTING"
  echo "    Reusing existing project: $PROJECT_REF"
else
  ORG_ID=$(sb GET /v1/organizations | jq -r '.[0].id')
  [ -n "$ORG_ID" ] && [ "$ORG_ID" != "null" ] || { echo "No Supabase organization found"; exit 1; }
  DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
  echo "    Creating project '$PROJECT_NAME' in $SUPABASE_REGION (org $ORG_ID)…"
  CREATE_RESP=$(sb POST /v1/projects "$(jq -n \
    --arg name "$PROJECT_NAME" \
    --arg org "$ORG_ID" \
    --arg region "$SUPABASE_REGION" \
    --arg pass "$DB_PASS" \
    '{name: $name, organization_id: $org, region: $region, db_pass: $pass}')")
  PROJECT_REF=$(echo "$CREATE_RESP" | jq -r '.id')
  [ -n "$PROJECT_REF" ] && [ "$PROJECT_REF" != "null" ] || { echo "Create failed: $CREATE_RESP"; exit 1; }
  echo "    Created: $PROJECT_REF"
  echo "    DB password (store in your password manager): $DB_PASS"
fi

echo "==> 2/7 Waiting for project to be healthy"
for i in $(seq 1 60); do
  STATUS=$(sb GET "/v1/projects/$PROJECT_REF" | jq -r '.status')
  [ "$STATUS" = "ACTIVE_HEALTHY" ] && break
  echo "    status=$STATUS (attempt $i/60)…"; sleep 10
done
[ "$STATUS" = "ACTIVE_HEALTHY" ] || { echo "Project never became healthy"; exit 1; }

SUPABASE_URL="https://$PROJECT_REF.supabase.co"

echo "==> 3/7 Applying migrations"
SQL_FILE="$REPO_ROOT/packages/db/scripts/all-migrations.sql"
[ -f "$SQL_FILE" ] || { echo "Missing $SQL_FILE"; exit 1; }
# The query endpoint takes a JSON body {"query": "..."}. jq -Rs slurps the file
# into a single JSON string.
MIGRATE_RESP=$(jq -Rs '{query: .}' "$SQL_FILE" | curl -sS -X POST \
  "$SB_API/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d @-)
if echo "$MIGRATE_RESP" | jq -e '.message? // .error?' >/dev/null 2>&1 && \
   [ "$(echo "$MIGRATE_RESP" | jq -r '.message? // .error? // empty')" != "" ]; then
  MSG=$(echo "$MIGRATE_RESP" | jq -r '.message? // .error?')
  if echo "$MSG" | grep -qi "already exists"; then
    echo "    Migrations already applied (idempotent skip)."
  else
    echo "    Migration error: $MSG"; exit 1
  fi
else
  echo "    Migrations applied."
fi

echo "==> 4/7 Verifying RLS on every public table"
RLS_CHECK=$(jq -n '{query: "select tablename from pg_tables where schemaname = '"'"'public'"'"' and rowsecurity = false"}' | curl -sS -X POST \
  "$SB_API/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d @-)
UNPROTECTED=$(echo "$RLS_CHECK" | jq -r 'if type == "array" then map(.tablename) | join(", ") else empty end')
if [ -n "$UNPROTECTED" ]; then
  echo "    ✗ RLS DISABLED on: $UNPROTECTED — refusing to continue."; exit 1
fi
echo "    ✓ RLS enabled on all public tables."

echo "==> 5/7 Fetching API keys"
KEYS=$(sb GET "/v1/projects/$PROJECT_REF/api-keys")
ANON_KEY=$(echo "$KEYS" | jq -r '.[] | select(.name == "anon") | .api_key')
SERVICE_KEY=$(echo "$KEYS" | jq -r '.[] | select(.name == "service_role") | .api_key')
[ -n "$ANON_KEY" ] || { echo "Could not fetch anon key"; exit 1; }

echo "==> 6/7 Deploying to Vercel"
cd "$REPO_ROOT"

# Link (creates the project if it doesn't exist)
npx -y vercel@latest link --yes --project "$PROJECT_NAME" --token "$VERCEL_TOKEN" >/dev/null

# Env vars (remove-then-add so re-runs update rather than fail)
for VAR in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  npx -y vercel@latest env rm "$VAR" production --yes --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true
done
printf '%s' "$SUPABASE_URL"  | npx -y vercel@latest env add NEXT_PUBLIC_SUPABASE_URL production      --token "$VERCEL_TOKEN" >/dev/null
printf '%s' "$ANON_KEY"      | npx -y vercel@latest env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token "$VERCEL_TOKEN" >/dev/null
printf '%s' "$SERVICE_KEY"   | npx -y vercel@latest env add SUPABASE_SERVICE_ROLE_KEY production     --token "$VERCEL_TOKEN" >/dev/null

# Deploy source (builds on Vercel; rootDirectory comes from project settings,
# but source deploys from the monorepo root work because vercel.json defines
# the build command and output directory)
DEPLOY_URL=$(npx -y vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN" 2>/dev/null | tail -1)
echo "    Deployed: $DEPLOY_URL"

echo "==> 7/7 Pointing Supabase auth at the live URL"
sb PATCH "/v1/projects/$PROJECT_REF/config/auth" "$(jq -n \
  --arg site "$DEPLOY_URL" \
  --arg redirect "$DEPLOY_URL/auth/callback" \
  '{site_url: $site, uri_allow_list: $redirect}')" >/dev/null
echo "    Auth site_url + redirect configured."

echo ""
echo "==> Smoke test"
HEALTH=$(curl -sS "$DEPLOY_URL/health" || echo '{"ok":false}')
echo "    /health → $HEALTH"
LOGIN_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$DEPLOY_URL/login")
echo "    /login  → HTTP $LOGIN_CODE"

echo ""
echo "============================================================"
echo " Live URL:      $DEPLOY_URL"
echo " Supabase ref:  $PROJECT_REF"
echo " Sign in as:    jennifer@crystalevents.eu (magic link)"
echo ""
echo " NEXT STEPS"
echo "  1. Open $DEPLOY_URL — you should see the login page"
echo "  2. Enter jennifer@crystalevents.eu → 'Email me a link'"
echo "  3. REVOKE both API tokens now (they are no longer needed):"
echo "     - supabase.com/dashboard/account/tokens"
echo "     - vercel.com/account/settings/tokens"
echo "============================================================"
