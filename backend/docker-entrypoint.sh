#!/bin/sh
set -e

cd /app/backend

echo "[entrypoint] Running database migrations (if any)"

if [ -d "./prisma/migrations" ]; then
  echo "[entrypoint] Running prisma migrate deploy"

  npx prisma migrate deploy --schema=./prisma/schema.prisma || {
    echo "[entrypoint] Migration failed"
    exit 1
  }

  echo "[entrypoint] Migrations applied successfully"
else
  echo "[entrypoint] No migrations folder found"
fi

echo "[entrypoint] Generating Prisma client"
npx prisma generate --schema=./prisma/schema.prisma

echo "[entrypoint] Starting app"
exec node dist/index.js