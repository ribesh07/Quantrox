#!/bin/sh
set -e

echo "[entrypoint] Generating Prisma client"
npx prisma generate

echo "[entrypoint] Running migrations"

npx prisma migrate deploy || {
    echo "Migration failed"
    exit 1
}

echo "[entrypoint] Starting application"

exec node dist/index.js