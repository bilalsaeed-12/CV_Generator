#!/bin/sh
set -eu

# Railway does not interpolate reference variables (e.g. ${{Postgres.DATABASE_URL}})
# into the values of other variables at runtime, so DATABASE_URL can't just be set
# to a reference in the Railway dashboard. Instead, Postgres's individual
# credentials (PGUSER, PGPASSWORD, PGPORT, PGDATABASE) are shared as real OS
# environment variables on this service, and we use those to build DATABASE_URL
# ourselves and write it to .env before the app starts — since Pydantic Settings
# reads .env first.

PGHOST="postgres.railway.internal"
PGPORT="${PGPORT:-5432}"

: "${PGUSER:?PGUSER is not set}"
: "${PGPASSWORD:?PGPASSWORD is not set}"
: "${PGDATABASE:?PGDATABASE is not set}"

DATABASE_URL="postgresql+asyncpg://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

cat > /app/.env <<EOF
DATABASE_URL=${DATABASE_URL}
EOF

echo "Generated /app/.env with DATABASE_URL pointing at ${PGHOST}:${PGPORT}/${PGDATABASE}"

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
