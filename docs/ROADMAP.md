# 6-Week Implementation Roadmap (High-level)

Week 1: Core & Schema
- Finalize Prisma models and run migrations
- Implement auth flows (register/login/refresh/password reset)
- Implement payment method and QR management models and APIs

Week 2: Exchange & Wallets
- Implement exchange request workflows and proof uploads
- Implement wallet ledger and credit/debit operations
- Start frontend pages for exchange and deposit

Week 3: Game Purchases & Admin Review
- Implement game point order flows and admin review
- Implement notification service (in-app + email)
- Admin panel pages for order review and payment accounts

Week 4: Security & 2FA
- Implement 2FA flows and backup codes
- Implement refresh token rotation and session management
- Add rate-limiting and input validation

Week 5: Analytics & Audit
- Add reporting endpoints and daily/monthly revenue queries
- Implement AuditLog collection and admin viewing tools
- Add charts to admin dashboard

Week 6: Hardening & Deploy
- Add CI/CD, migrations deploy, and test coverage
- Dockerize and prepare production deployments
- Monitoring, alerting, and performance tuning

Post-launch: iterate on UX, add payment provider integrations (if needed), and scale infra.
