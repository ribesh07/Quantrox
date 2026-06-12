#!/bin/sh
set -e

cd "$(dirname "$0")"

echo "[entrypoint] Running database migrations (if any)"

if [ -d "./prisma/migrations" ]; then
  echo "[entrypoint] Running prisma migrate deploy"

  set +e
  OUT=$(node node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma 2>&1)
  STATUS=$?
  set -e

  if [ $STATUS -ne 0 ]; then
    echo "[entrypoint] Prisma migrate deploy failed:"
    echo "$OUT"

    echo "$OUT" | grep -q "P3005"
    IS_P3005=$?

    if [ "${PRISMA_AUTO_BASELINE:-false}" = "true" ]; then
      echo "[entrypoint] AUTO BASELINE MODE ENABLED"

      if node ./scripts/verify-prisma-baseline.js; then
        echo "[entrypoint] Schema verified. Resolving migrations..."

        for m in ./prisma/migrations/*; do
          if [ -d "$m" ]; then
            name=$(basename "$m")
            echo "[entrypoint] Marking applied: $name"
            node node_modules/prisma/build/index.js migrate resolve --applied "$name" --schema=./prisma/schema.prisma
          fi
        done

        echo "[entrypoint] Re-running migrate deploy"
        node node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
      else
        echo "[entrypoint] Schema verification FAILED. Aborting."
        exit 1
      fi

    else
      if [ $IS_P3005 -eq 0 ]; then
        echo "[entrypoint] ERROR: Non-empty database detected (P3005)"
        echo "Enable PRISMA_AUTO_BASELINE=true only if schema matches exactly"
        exit 1
      else
        exit 1
      fi
    fi
  else
    echo "[entrypoint] migrations applied successfully"
  fi
else
  echo "[entrypoint] No migrations folder found"
fi

echo "[entrypoint] Generating Prisma client"

node node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

echo "[entrypoint] Starting app"
exec node dist/index.js