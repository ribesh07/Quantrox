#!/bin/sh
set -e

cd "$(dirname "$0")"

echo "[entrypoint] Running prisma migrate deploy"
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[entrypoint] Starting application"
exec node dist/index.js
