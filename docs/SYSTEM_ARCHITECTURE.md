# Quantrox System Architecture

Overview
- Frontend: Next.js + TypeScript + Tailwind + ShadCN UI — serves user and admin UIs, uses React Query for data fetching and optimistic updates.
- Backend: Node.js + Express (project uses modular controllers/services) with TypeScript and Prisma ORM. Exposes REST API under `/api/*`.
- Database: PostgreSQL (Prisma schema in `backend/prisma/schema.prisma`).
- Storage: Uploads are stored locally in `uploads/` for development; production recommendation: AWS S3 or Cloudinary.
- Realtime: WebSocket/Socket.IO for in-app notifications and admin events.
- Authentication: JWT access tokens + refresh tokens; optional Google OAuth; optional TOTP 2FA using `speakeasy`.
- Payment flow: Manual QR/account management by admin. Users follow instructions and upload proof; admins verify and credit wallets.

Key services
- Auth Service: registration, login, refresh, password reset, email verification, 2FA.
- Payment Service: manage payment methods, payment accounts, QR codes, rates, fees.
- Exchange Service: create exchange requests, upload proofs, admin review workflow, credit USDT wallets.
- Game Service: manage games, packages, purchase flows, fulfillment.
- Wallet Service: per-user wallets per payment method and USDT ledger, transaction history.
- Notification Service: in-app, email, and queued delivery with templates.
- AuditLog Service: persistent audit logs for admin/user actions, status changes, and wallet operations.

Scaling & reliability
- Stateless app servers behind Nginx (load balancer) with sticky sessions optional for websockets.
- Horizontal scale backend; use Redis for session/refresh token store and for pub/sub for notifications.
- Database: managed PostgreSQL with read-replicas for analytics; use connection pooling.
- Background workers: process heavy tasks (email sending, notification retries, reconciliation).

Security
- All sensitive secrets stored in environment variables / secret manager.
- Rate limiting for auth endpoints; CSRF token on any state-changing requests from browser when required.
- Input validation via Zod at API boundaries.

Deployment
- Dockerized backend and frontend; compose file included at repository root.
- CI pipeline: build, test, lint, migration, and deploy.

Files of interest
- Prisma schema: `backend/prisma/schema.prisma`
- Backend entry: `backend/src/index.ts`
- Frontend admin UI: `frontend/src/app/admin`

Next: API specification and Prisma model summary.