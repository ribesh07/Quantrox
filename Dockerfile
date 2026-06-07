FROM node:22-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci


FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build


FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

ENV NODE_ENV=production


COPY --from=builder /app/public ./public

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/public/uploads

EXPOSE 3056

CMD ["npm", "start"]