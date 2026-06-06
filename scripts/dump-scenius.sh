#!/usr/bin/env bash
set -euo pipefail

# dump-scenius.sh
# ---------------
# Dumps REAL historical data (DATA ONLY) from scenius's existing Supabase
# Postgres into ./scenius-data.sql, ready to be replayed into a freshly
# schema-migrated base.privy database via scripts/import-data.sh.
#
# Why --column-inserts: every row becomes a self-contained
#   INSERT INTO public.<table> (col, ...) VALUES (...);
# statement. That is portable across Postgres versions, survives column
# reordering, and is roughly idempotent-ish to re-read/edit (vs the default
# COPY-from-stdin blob). It is slower, but the data set here is small and
# correctness/portability matters more than speed for a one-shot demo seed.
#
# Why this table order: the list is in FK-dependency order (parents first),
# so the resulting file inserts rows in an order that never violates a
# foreign-key constraint on import.

# Tables in FK-dependency order (parents before children).
TABLES=(
  tastemakers
  artists
  catalog_snapshots
  tracks
  track_snapshots
  predictions
  posts
)

OUTPUT="./scenius-data.sql"

# --- Pre-flight -------------------------------------------------------------
if [[ -z "${SCENIUS_DATABASE_URL:-}" ]]; then
  echo "ERROR: SCENIUS_DATABASE_URL is not set." >&2
  echo "       Export the scenius Supabase connection string first, e.g.:" >&2
  echo "         export SCENIUS_DATABASE_URL=\"\$(grep '^DATABASE_URL=' /Users/oakgroup/scenius/.env | cut -d= -f2-)\"" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found on PATH. Install the Postgres client tools." >&2
  exit 1
fi

# --- Build the --table flags in order --------------------------------------
TABLE_FLAGS=()
for t in "${TABLES[@]}"; do
  TABLE_FLAGS+=( "--table=public.${t}" )
done

echo "==> Dumping ${#TABLES[@]} tables (data only) from scenius -> ${OUTPUT}"
echo "    Tables (FK order): ${TABLES[*]}"

pg_dump "${SCENIUS_DATABASE_URL}" \
  --data-only \
  --no-owner \
  --no-privileges \
  --column-inserts \
  "${TABLE_FLAGS[@]}" \
  > "${OUTPUT}"

BYTES=$(wc -c < "${OUTPUT}" | tr -d ' ')
INSERTS=$(grep -c '^INSERT INTO' "${OUTPUT}" || true)

echo "==> Done. Wrote ${OUTPUT} (${BYTES} bytes, ${INSERTS} INSERT statements)."
echo "    Next: set DATABASE_URL to the fresh base.privy DB, then run:"
echo "      bash scripts/import-data.sh"
