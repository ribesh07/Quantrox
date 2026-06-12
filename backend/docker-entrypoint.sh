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
      # Before auto-baselining, introspect DB and compare model lists
      echo "[entrypoint] PRISMA_AUTO_BASELINE=true — verifying DB schema matches datamodel"
      set +e
      INTROSPECT=$(npx prisma db pull --print --schema=./prisma/schema.prisma 2>&1)
      PULL_STATUS=$?
      set -e
      if [ $PULL_STATUS -ne 0 ]; then
        echo "[entrypoint] prisma db pull failed, cannot verify schema automatically:" 
        echo "$INTROSPECT"
        echo "Aborting auto-baseline to avoid unsafe changes."
        exit 1
      fi

      # Extract model names from local datamodel and introspected datamodel
      LOCAL_MODELS=$(grep -E '^model ' ./prisma/schema.prisma | awk '{print $2}' | sort)
      DB_MODELS=$(echo "$INTROSPECT" | grep -E '^model ' | awk '{print $2}' | sort)

      if [ "$LOCAL_MODELS" = "$DB_MODELS" ]; then
        echo "[entrypoint] Model lists match between datamodel and DB introspection — safe to baseline"
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
        echo "[entrypoint] Model list mismatch between datamodel and DB. Not safe to auto-baseline."
        echo "Local models:"; echo "$LOCAL_MODELS"
        echo "DB models:"; echo "$DB_MODELS"
        echo "Aborting. Please review differences and run manual baseline only if you have verified schemas match."
        exit 1
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
