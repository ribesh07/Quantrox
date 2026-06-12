# Quantrox Deployment Runbook

## Purpose
This runbook describes the production deployment workflow, CI requirements, and smoke test validation for the Quantrox platform.

## Required secrets
Set these secrets in GitHub Actions or your deployment environment:

- `DOCKER_REGISTRY` — container registry hostname (example: `ghcr.io/owner` or `docker.io/org`)
- `DOCKER_USERNAME` — registry username
- `DOCKER_PASSWORD` — registry password or token
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — strong JWT signing secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP settings for email delivery
- `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — S3 upload storage, optional if local uploads are acceptable
- `REDIS_URL` — Redis connection string for Socket.IO scaling and optional session/refresh token storage
- `FRONTEND_URL` — production frontend base URL

## GitHub Actions CI/CD
The CI workflow is defined in `.github/workflows/ci-cd.yml` and performs the following steps:

1. Checkout repository
2. Setup Node.js
3. Cache `node_modules`
4. Login to Docker registry using `DOCKER_REGISTRY`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`
5. Build the frontend and backend
6. Start Postgres and Redis service containers
7. Run backend smoke tests against the built backend
8. Build and push Docker images for frontend and backend

### Required GitHub secrets
- `DOCKER_REGISTRY`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

### Local environment variables
Use `.env.sample` and `frontend/.env.production.sample` as starting points.

## Smoke tests
The backend contains a smoke test script at `backend/scripts/smoke-test.js`.
Run this locally after starting the backend:

```bash
cd backend
npm run build
API_URL=http://localhost:3001 npm run smoke
```

The smoke test confirms the `/health` endpoint returns `{ status: 'ok' }`.

## Local deployment using Docker Compose
The production compose file is `docker-compose.prod.yml`.

1. Create a `.env` file at the repository root or export required values.
2. Run:

```bash
docker compose -f docker-compose.prod.yml up -d
```

3. Confirm services are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

4. Reach the frontend on port `3000` and backend on port `3001`.

## Production validation checklist
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Docker images pushed to registry
- [ ] `POSTGRES_DB` and Redis are healthy
- [ ] Smoke test passes
- [ ] Email/SMS notifications deliver correctly
- [ ] S3 uploads are accessible if enabled
- [ ] CORS origins include production frontend URL
- [ ] Secrets are rotated and stored securely
