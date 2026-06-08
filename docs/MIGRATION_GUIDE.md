# Migration Guide: Monorepo Transition

## Changes
- Moved `src` to `frontend/src`.
- Moved `prisma` to `shared/prisma`.
- Created `backend/` for Express API.
- Replaced Server Actions with REST API calls.

## How to Run
1. Install dependencies: `npm install`
2. Generate Prisma client: `npm run prisma:generate --workspace=@quantrox/shared`
3. Run Backend: `npm run dev --workspace=@quantrox/backend`
4. Run Frontend: `npm run dev --workspace=@quantrox/frontend`
