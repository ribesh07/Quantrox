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

    echo "$OUT" | grep -q "P3005" || grep -q "The database schema is not empty"
    IS_P3005=$?

    if [ "${PRISMA_AUTO_BASELINE:-false}" = "true" ]; then
      echo "[entrypoint] PRISMA_AUTO_BASELINE=true — verifying DB schema against local datamodel before resolving migrations"
      if node ./scripts/verify-prisma-baseline.js; then
        echo "[entrypoint] Schema verification succeeded. Resolving existing migrations as applied."
        for m in ./prisma/migrations/*; do
          if [ -d "$m" ]; then
            name=$(basename "$m")
            echo "[entrypoint] Marking migration applied: $name"
            npx prisma migrate resolve --applied "$name" --schema=./prisma/schema.prisma
          fi
        done

        echo "[entrypoint] Re-running 'prisma migrate deploy' after resolving applied migrations"
        npx prisma migrate deploy --schema=./prisma/schema.prisma
      else
        echo "[entrypoint] Schema verification failed. Aborting startup to avoid unsafe baseline."
        exit 1
      fi
    else
      if [ $IS_P3005 -eq 0 ]; then
        echo "[entrypoint] ERROR: Prisma detected a non-empty database (P3005)."
        echo "Set PRISMA_AUTO_BASELINE=true only after verifying the database schema matches the current Prisma schema exactly."
        echo "Exiting to avoid unintended schema history changes."
        exit 1
      else
        echo "[entrypoint] prisma migrate deploy failed with an unexpected error. Check the error output above."
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
