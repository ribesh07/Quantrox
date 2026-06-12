#!/bin/sh
set -e

cd "$(dirname "$0")"

echo "[entrypoint] Running prisma migrate deploy"

# ✅ FIX: no npx (Coolify-safe)
node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma

echo "[entrypoint] Generating Prisma client"
node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

echo "[entrypoint] Starting application"
exec node dist/index.js