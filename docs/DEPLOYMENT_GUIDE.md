# Deployment Guide

Prerequisites
- Docker and Docker Compose
- PostgreSQL (managed or self-hosted)
- Redis (for session/refresh token store and pub/sub)
- S3-compatible storage for uploads
- SMTP provider (SendGrid, SES) for emails

Local development
- Start DB and Redis (docker-compose is included)
- Set `.env` values in `backend/.env` and `frontend/.env`
- Run migrations: `npx prisma migrate dev --name init`
- Start backend: `npm run dev` (in `backend`)
- Start frontend: `npm run dev` (in `frontend`)

Production
- Build and push Docker images for backend and frontend
- Use `prisma migrate deploy` in CI to apply migrations
- Use environment-specific variables for DB, Redis, and S3
- Configure Nginx as reverse proxy with TLS (Let's Encrypt)
- Use a process manager / orchestrator (Kubernetes, ECS, or Docker Compose in small setups)
- Use `docker-compose.prod.yml` for small production deployments with Redis.

Environment variables and secrets
- `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `REDIS_URL` for Socket.IO scaling and session/refresh token storage
- `DOCKER_REGISTRY`, `DOCKER_USERNAME`, `DOCKER_PASSWORD` for GitHub Actions image push

CI/CD
- Lint, typecheck, run unit tests
- Build Docker images and push to registry
- Deploy to staging, run smoke tests, then promote to production

Backups & rollback
- Nightly DB backups and backup verification
- Backup S3 buckets for uploads
- Maintain migration rollback strategy (manual rollback scripts if needed)

Observability
- Centralized logs (Datadog / ELK)
- Metrics (Prometheus + Grafana)
- Alerts for errors and SLA breaches

Security
- Rotate secrets regularly
- Use IAM roles for services accessing S3/DB

Scaling
- Horizontal scale backend; stateless services
- Use connection pooler (PgBouncer) for DB
- Use CDN for static assets and uploaded images

Next: Implementation roadmap and wireframes.