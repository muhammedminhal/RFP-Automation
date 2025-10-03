#!/usr/bin/env bash
set -euo pipefail

# Runs SQL migrations against configured postgres
: "${POSTGRES_HOST:?Need to set POSTGRES_HOST}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:?Need to set POSTGRES_USER}"
: "${POSTGRES_DB:?Need to set POSTGRES_DB}"
: "${POSTGRES_PASSWORD:?Need to set POSTGRES_PASSWORD}"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../db/init/migrations" >/dev/null 2>&1 && pwd )"

for f in "$DIR"/*.sql; do
  echo "Applying migration $f"
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done
