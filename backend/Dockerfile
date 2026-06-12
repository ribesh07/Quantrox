# Stage 1: Build
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend config and sources
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/ ./backend/

WORKDIR /app/backend

# Install backend dependencies, including dev dependencies needed for build tooling
RUN npm install --include=dev

# Generate Prisma client for the Linux deployment runtime
RUN node ./node_modules/prisma/build/index.js generate

# Ensure TypeScript compiler is executable and then build backend
RUN node ./node_modules/typescript/bin/tsc

# Stage 2: Runner
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend built assets and dependencies
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
# Copy Prisma schema/migrations so the runner can apply migrations at startup
COPY --from=builder /app/backend/prisma ./backend/prisma
# Copy entrypoint script to run migrations and start the app
COPY backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh
RUN chmod +x ./backend/docker-entrypoint.sh

EXPOSE 3001

CMD ["/bin/sh", "-c", "./backend/docker-entrypoint.sh"]
