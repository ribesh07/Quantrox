#!/bin/sh
set -e

echo "[entrypoint] Generating Prisma client"
npx prisma generate

echo "[entrypoint] Running migrations"
npx prisma db push || echo "[entrypoint] Migration skipped"

echo "[entrypoint] Starting application"
exec node dist/index.js