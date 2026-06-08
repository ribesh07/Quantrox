# Stage 1: Build
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root config and shared package first
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY backend/ ./backend/

# Install dependencies for the whole monorepo
RUN npm install

# Build shared package (includes prisma generate)
RUN npm run build:shared

# Build backend
RUN npm run build:backend

# Stage 2: Runner
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/backend/package.json ./backend/

# Install only production dependencies
RUN npm install --omit=dev

# Copy built assets
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/prisma ./shared/prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
