#!/usr/bin/env bash
set -euo pipefail

# import-data.sh
# --------------
# Replays ./scenius-data.sql (produced by scripts/dump-scenius.sh) into the
# FRESH base.privy Supabase Postgres referenced by DATABASE_URL.
#
# The schema MUST already exist (run `pnpm db:push` first). This script only
# loads data; it does not create tables. The dump's INSERTs are ordered by
# FK dependency, so a clean schema with no rows loads without constraint
# errors.

INPUT="./scenius-data.sql"

# Tables in FK-dependency order (used only for the post-import row counts).
TABLES=(
  tastemakers
  artists
  catalog_snapshots
  tracks
  track_snapshots
  predictions
  posts
)

# --- Pre-flight: connection string ------------------------------------------
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "       Export the FRESH base.privy Supabase pooler connection string first." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found on PATH. Install the Postgres client tools." >&2
  exit 1
fi

# --- Pre-flight: dump file present ------------------------------------------
if [[ ! -f "${INPUT}" ]]; then
  echo "ERROR: ${INPUT} not found." >&2
  echo "       Run 'bash scripts/dump-scenius.sh' first to produce it." >&2
  exit 1
fi

# --- Pre-flight: schema must exist ------------------------------------------
# Refuse to run against a database whose schema has not been migrated yet.
echo "==> Checking that the schema exists (looking for public.tastemakers)..."
SCHEMA_OK=$(psql "${DATABASE_URL}" -tA -c \
  "SELECT to_regclass('public.tastemakers') IS NOT NULL;")

if [[ "${SCHEMA_OK}" != "t" ]]; then
  echo "ERROR: table public.tastemakers does not exist in the target database." >&2
  echo "       The schema has not been migrated. Run this first:" >&2
  echo "         pnpm db:push" >&2
  echo "       then re-run: bash scripts/import-data.sh" >&2
  exit 1
fi

# --- Import -----------------------------------------------------------------
echo "==> Importing ${INPUT} into target database..."
# ON_ERROR_STOP=1 so a single failed INSERT aborts loudly instead of
# silently producing a half-populated demo.
psql "${DATABASE_URL}" --set ON_ERROR_STOP=1 -f "${INPUT}"

# --- Post-import row counts -------------------------------------------------
echo "==> Import complete. Row counts:"
for t in "${TABLES[@]}"; do
  COUNT=$(psql "${DATABASE_URL}" -tA -c "SELECT count(*) FROM public.${t};")
  printf "    %-20s %s\n" "${t}" "${COUNT}"
done

echo "==> Done. Visit /leaderboard to confirm the populated demo data."
