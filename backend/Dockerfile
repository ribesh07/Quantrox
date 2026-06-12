# Stage 1: Build
FROM node:22-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend config and sources
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/ ./backend/

WORKDIR /app/backend

# Install backend dependencies, including dev dependencies needed for build tooling
RUN npm ci --include=dev

# Generate Prisma client for the Linux deployment runtime
RUN node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

# Ensure TypeScript compiler is executable and then build backend
RUN node ./node_modules/typescript/bin/tsc

# Stage 2: Runner
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy backend built assets and dependencies
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
# Copy Prisma schema/migrations so the runner can apply migrations at startup
COPY --from=builder /app/backend/prisma ./prisma
# Copy runtime helper scripts used by the entrypoint
COPY --from=builder /app/backend/scripts ./scripts
# Copy entrypoint script to run migrations and start the app
COPY --from=builder /app/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
