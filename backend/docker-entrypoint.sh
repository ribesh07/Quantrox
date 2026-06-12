#!/bin/sh
set -e

echo "[entrypoint] Running database migrations (if any)"
if [ -d "./backend/prisma/migrations" ]; then
  npx prisma migrate deploy || true
else
  echo "[entrypoint] No Prisma migrations directory found; skipping"
fi

echo "[entrypoint] Ensuring Prisma client is generated"
npx prisma generate || true

echo "[entrypoint] Starting application"
exec node backend/dist/index.js
