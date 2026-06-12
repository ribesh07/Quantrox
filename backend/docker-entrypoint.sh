#!/bin/sh
set -e

cd "$(dirname "$0")"

echo "[entrypoint] Running database migrations (if any)"
if [ -d "./prisma/migrations" ]; then
  echo "[entrypoint] Attempting 'prisma migrate deploy'"
  set +e
  OUT=$(npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1)
  STATUS=$?
  set -e

  if [ $STATUS -ne 0 ]; then
    echo "[entrypoint] Prisma migrate deploy failed:"
    echo "$OUT"

    echo "$OUT" | grep -q "P3005" || grep -q "The database schema is not empty";
    IS_P3005=$?

    # PRISMA_AUTO_BASELINE enables automatic marking of existing migrations as applied
    if [ "${PRISMA_AUTO_BASELINE:-false}" = "true" ]; then
      if [ $IS_P3005 -eq 0 ]; then
        echo "[entrypoint] Detected non-empty database (P3005). Marking existing migrations as applied."
        for m in ./prisma/migrations/*; do
          if [ -d "$m" ]; then
            name=$(basename "$m")
            echo "[entrypoint] Marking migration applied: $name"
            npx prisma migrate resolve --applied "$name" --schema=./prisma/schema.prisma || true
          fi
        done

        echo "[entrypoint] Re-running 'prisma migrate deploy' after resolving"
        npx prisma migrate deploy --schema=./prisma/schema.prisma || true
      else
        echo "[entrypoint] prisma migrate failed for another reason. Attempting safe fallback: prisma db push"
        npx prisma db push --schema=./prisma/schema.prisma || true
      fi
    else
      if [ $IS_P3005 -eq 0 ]; then
        echo "[entrypoint] ERROR: Prisma detected a non-empty database (P3005)."
        echo "To auto-resolve and mark migrations as applied set PRISMA_AUTO_BASELINE=true in your environment."
        echo "Exiting to avoid unintended schema changes."
        echo "$OUT"
        exit 1
      else
        echo "[entrypoint] prisma migrate failed:"
        echo "$OUT"
        exit 1
      fi
    fi
  else
    echo "[entrypoint] prisma migrate deploy succeeded"
  fi
else
  echo "[entrypoint] No Prisma migrations directory found; skipping"
fi

echo "[entrypoint] Ensuring Prisma client is generated"
npx prisma generate --schema=./prisma/schema.prisma || true

echo "[entrypoint] Starting application"
exec node dist/index.js
