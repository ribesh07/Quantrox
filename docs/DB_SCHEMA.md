# Database Schema Summary

Core Prisma models (located at `backend/prisma/schema.prisma`)

- `User` — auth profile, role, 2FA fields, device links, notification prefs
- `Wallet` — per-user, per-payment-method balances: `balance`, `pendingBalance`, `frozenBalance`
- `PaymentMethod` — Admin-managed methods (name, category, rate, fee, limits)
- `PaymentAccount` — Admin uploaded account details & QR for each `PaymentMethod`
- `Order` — generic order entity for deposits/exchanges/game-topups
- `ExchangeRequest` — exchange-specific request (amount, rate, status, usdtReceived)
- `GamePointOrder` — game purchases tracking
- `ProofUpload` — file uploads for proofs
- `WalletTransaction` — ledger entries for wallets
- `Transaction` — financial transaction record tied to orders
- `QRCode` — stored QR images metadata
- `Notification`, `NotificationTemplate`, `NotificationPreference` — notification system
- `AuditLog` — audit trails for user/admin actions
- `ExchangeRate`, `FeeSetting`, `SystemSettings` — admin-configurable settings

Indexes and constraints
- Unique constraints on `User.email` and `User.username`.
- `Wallet` unique per `(userId, paymentMethodId)`.
- `Transaction.orderId` unique when one-to-one with `Order`.

Migration
- Use `npx prisma migrate dev --name <name>` to create migrations in development.
- For production, generate SQL with `prisma migrate deploy` and apply using CI/CD safely.

Data retention & housekeeping
- Archive old `ProofUpload` and `Notification` entries older than configurable threshold.
- Use partitioning or reporting schema for heavy analytics tables.

Next: Security architecture and deployment guide.