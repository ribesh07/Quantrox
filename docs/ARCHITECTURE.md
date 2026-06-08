# Quantrox Architecture Documentation

## Overview
Quantrox is a professional gaming asset exchange platform refactored into a modern monorepo structure.

## Folder Structure
```
root/
├── frontend/        # Next.js 15 App Router (UI/UX)
├── backend/         # Express.js + TypeScript (API/Logic)
├── shared/          # Prisma schema, Zod types, Common Utilities
├── docs/            # Project documentation
└── scripts/         # Automation and deployment scripts
```

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Radix UI, React Query.
- **Backend**: Node.js, Express, TypeScript, JWT.
- **Database**: PostgreSQL with Prisma ORM.
- **Communication**: REST API with JSON.

## Authentication Flow
1. User logs in via `/api/auth/login`.
2. Backend validates credentials and returns a JWT.
3. Frontend stores JWT in `localStorage`.
4. Subsequent requests include the JWT in the `Authorization` header.
