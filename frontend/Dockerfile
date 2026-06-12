# Stage 1: Build
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root config and frontend sources
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY frontend/ ./frontend/

# Install frontend dependencies
RUN npm install --prefix frontend

# Build frontend
RUN npm run build:frontend

# Stage 2: Runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output and static files
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

EXPOSE 3056

# Next.js standalone server starts on port 3000 by default, 
# we can override it with the PORT env variable
ENV PORT=3056
CMD ["node", "frontend/server.js"]
