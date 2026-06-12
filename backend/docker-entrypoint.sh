#!/bin/sh
set -e

cd "$(dirname "$0")"

echo "[entrypoint] Running database migrations (if any)"
if [ -d "./prisma/migrations" ]; then
  npx prisma migrate deploy --schema=./prisma/schema.prisma
else
  echo "[entrypoint] No Prisma migrations directory found; skipping"
fi

echo "[entrypoint] Ensuring Prisma client is generated"
npx prisma generate --schema=./prisma/schema.prisma

echo "[entrypoint] Starting application"
exec node dist/index.js
