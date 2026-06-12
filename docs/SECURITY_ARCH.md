# Security Architecture

Auth
- JWT access tokens short-lived (e.g., 15 minutes), refresh tokens stored in HTTP-only secure cookies or Redis with rotation.
- Passwords hashed with `bcrypt` (cost factor >= 12).
- Optional Google OAuth2 integration; store provider ID in `User`.
- Optional 2FA via TOTP (speakeasy) and backup codes.

Transport
- Enforce HTTPS for all traffic. Use HSTS and redirect HTTP to HTTPS.

Input validation
- Validate all request payloads with Zod; sanitize HTML/inputs returned to clients.

Data protection
- Secrets (JWT secret, DB credentials, email API keys) in secret manager (AWS Secrets Manager, Azure Key Vault).
- Encrypt sensitive fields at rest if required (e.g., backup codes, optional PII).

Rate limiting & abuse
- Protect authentication endpoints with rate limiting (eg. 100/hr per IP) and abusive behaviour logging.

Network & infra
- Use VPC for DB and backend; limit incoming ports.
- Use managed Postgres with automated backups and point-in-time restore.

Auditability
- Log user and admin actions to `AuditLog` with `userId`, `action`, `resource`, `resourceId`, `changes`, `ip`.

Monitoring & alerts
- Export metrics for CPU, memory, DB connections, queue lengths, and error rates.
- Set alerts for high error rates and suspicious activity (login spikes, failed 2FA attempts).

Penetration testing
- Run periodic security scans and pentests before production launch.

Compliance
- Prepare data deletion and export workflows for GDPR/CCPA compliance if needed.