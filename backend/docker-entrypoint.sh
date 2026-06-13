#!/bin/sh
set -e

cd /app/backend

echo "[entrypoint] Running migrations"
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[entrypoint] Generating Prisma client"
npx prisma generate --schema=./prisma/schema.prisma

echo "[entrypoint] Starting app"
exec node dist/index.js