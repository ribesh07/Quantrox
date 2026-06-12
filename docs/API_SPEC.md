# API Specification (High-level)

Base URL: `/api`

Authentication
- POST `/api/auth/register` — register new user
- POST `/api/auth/login` — login (returns access + refresh token)
- POST `/api/auth/refresh` — refresh access token
- POST `/api/auth/logout` — revoke refresh token
- POST `/api/auth/forgot-password` — request password reset
- POST `/api/auth/reset-password` — perform password reset
- POST `/api/auth/verify-email` — verify email token

2FA
- POST `/api/2fa/generate` — generate TOTP secret (returns otpauth URL)
- POST `/api/2fa/verify` — verify TOTP code
- POST `/api/2fa/enable` — enable 2FA for user
- POST `/api/2fa/disable` — disable 2FA

Public Payment Methods
- GET `/api/payment-methods` — list active public methods (category filter)

Admin Payment Methods
- GET `/api/admin/payment-methods`
- POST `/api/admin/payment-methods`
- PATCH `/api/admin/payment-methods/:id`
- DELETE `/api/admin/payment-methods/:id`

Payment Accounts / QR Management
- GET `/api/admin/payment-accounts`
- POST `/api/admin/payment-accounts` (multipart: upload QR)
- PATCH `/api/admin/payment-accounts/:id`
- DELETE `/api/admin/payment-accounts/:id`

Exchange Requests
- POST `/api/exchanges` — create exchange request (user) — returns transaction id and payment details
- GET `/api/exchanges/me` — list user exchange requests
- POST `/api/exchanges/:id/proof` — upload proof for exchange
- GET `/api/admin/exchange-requests` — admin list
- PATCH `/api/admin/exchange-requests/:id/approve`
- PATCH `/api/admin/exchange-requests/:id/reject`

Game Point Orders
- POST `/api/game-point-orders` — create order
- POST `/api/game-point-orders/:id/proof` — upload proof
- GET `/api/game-point-orders/me`
- Admin review endpoints under `/api/admin/game-point-orders`

Wallets & Transactions
- GET `/api/wallets` — list user's wallets and balances
- POST `/api/wallets/:id/credit` — admin credit
- POST `/api/wallets/:id/debit` — admin debit
- GET `/api/wallets/:id/transactions` — ledger

Notifications
- GET `/api/notifications/me`
- POST `/api/admin/notifications/broadcast`

Admin & Analytics
- GET `/api/admin/stats` — dashboard stats
- GET `/api/admin/reports/daily-revenue?from=&to=`

File uploads
- Proof uploads stored in upload directory and referenced by `ProofUpload` model; support `png,jpg,jpeg,pdf`.

Notes
- All admin endpoints require `Authorization: Bearer <token>` with admin roles.
- Use `X-Request-ID` for traceability and include in audit logs where applicable.
- Validation and error formats follow consistent `{ success: boolean, message?: string, data?: any }` structure.

Next: DB schema summary and mapping to endpoints.