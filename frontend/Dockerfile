# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy frontend config and sources
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY frontend/ ./frontend/

WORKDIR /app/frontend

# Install frontend dependencies
RUN npm ci

# Build frontend
RUN npm run build

# Stage 2: Runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output and static files
COPY --from=builder /app/frontend/public ./frontend/public
# Place the Next.js standalone into the `frontend` folder so `frontend/server.js` exists
COPY --from=builder /app/frontend/.next/standalone ./frontend/
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

EXPOSE 3056

# Next.js standalone server starts on port 3000 by default, 
# we can override it with the PORT env variable
ENV PORT=3056
CMD ["node", "frontend/server.js"]
