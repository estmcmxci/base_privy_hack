#!/bin/bash
# Paste-into-terminal Vercel env setup for scenius.blog.
# Prerequisite (once): `vercel login` and `vercel link` this repo to the Scenius project.
#
# Re-run `vercel env rm <NAME> <env> -y` first if you need to overwrite an existing var.

set -euo pipefail
cd "$(dirname "$0")/.."

read_env_value() {
  grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | sed 's/^"//; s/"$//'
}

push() {
  local name="$1"
  local env="$2"
  local value="$3"
  printf '%s' "$value" | vercel env add "$name" "$env"
}

push_both() {
  local name="$1"
  local value
  value="$(read_env_value "$name")"
  push "$name" production "$value"
  push "$name" preview "$value"
}

# --- Shared values (Production + Preview) ---
for name in \
  DATABASE_URL \
  SUPABASE_SERVICE_ROLE_KEY \
  SOUNDCLOUD_CLIENT_ID \
  SOUNDCLOUD_CLIENT_SECRET \
  EAS_PRIVATE_KEY \
  EAS_SCHEMA_UID_PREDICTION \
  EAS_SCHEMA_UID_REPUTATION \
  NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_ANON_KEY \
  NEXT_PUBLIC_PARA_API_KEY
do
  push_both "$name"
done

# --- Per-env values ---
push NEXT_PUBLIC_APP_URL production "https://scenius.blog"
push NEXT_PUBLIC_APP_URL preview   "https://\$VERCEL_URL"

# --- CRON_SECRET: freshly generated, Production only ---
CRON_SECRET="$(openssl rand -hex 32)"
push CRON_SECRET production "$CRON_SECRET"

echo ""
echo "Generated CRON_SECRET (save this — needed for manual cron triggers in SCE-59):"
echo "  $CRON_SECRET"
echo ""
echo "Done. Verify with: vercel env ls"
