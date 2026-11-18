# Deployment

## Environments

| Environment | How | Notes |
| ----------- | --- | ----- |
| Local | `make db-up && make dev` | PostgreSQL and Redis in Docker, apps on the host |
| Compose | `make docker-up` | Entire stack including mail catcher (`deploy/docker-compose.yml`) |
| Kubernetes | manifests in `deploy/k8s/` | One deployment per component, shared config map and secret |

## Images

The `docker` workflow builds and pushes one image per component to `ghcr.io/your-org/clearpath-<name>`: `api`, `web`, `worker`, `analytics`, `audit-gateway`. Dockerfiles live in `deploy/` (Node apps) and next to each side service.

## Configuration

All settings are environment variables; `.env.example` lists them with safe development values. Production requirements:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: 32+ characters, different from each other (the API refuses to boot otherwise).
- `AUDIT_GATEWAY_SIGNING_KEY`: 16+ characters, identical on the API and the gateway.
- `DATABASE_URL` pointing at a managed PostgreSQL 16 instance with TLS.
- `WEB_ORIGIN` listing the exact browser origins allowed by CORS.

Run `node scripts/check-env.js` as a pre-flight step.

## Database migrations

```bash
npx prisma migrate deploy
```

Run this once per release before rolling out the API (for example as a Kubernetes job or CI step). The `migrations-check` workflow blocks pull requests whose schema and migrations disagree.

## Kubernetes

```bash
kubectl apply -f deploy/k8s/configmap.yaml
kubectl create secret generic clearpath-secrets \
  --from-literal=DATABASE_URL=... --from-literal=REDIS_URL=... \
  --from-literal=JWT_ACCESS_SECRET=... --from-literal=JWT_REFRESH_SECRET=... \
  --from-literal=AUDIT_GATEWAY_SIGNING_KEY=...
kubectl apply -f deploy/k8s/
```

- API readiness uses `/api/health`; use `/api/health/ready` for a deeper dependency check if your platform supports separate probes.
- Keep the worker at one replica.
- The audit gateway needs a persistent volume mounted at its data directory (`AUDIT_GATEWAY_DATA_DIR`).
- `deploy/nginx.conf` shows a reverse proxy layout for non-Kubernetes hosts.

## Release process

1. Update `CHANGELOG.md` and bump versions.
2. Tag `vX.Y.Z`; the `release` workflow publishes notes and the `docker` workflow publishes images.
3. Apply migrations, then roll out API, worker, analytics, gateway and web in that order.

## Rollback

Application images are immutable per tag, so roll back by redeploying the previous tag. Migrations are forward-only; ship destructive changes in two releases (stop using, then drop) so that a rollback never meets an incompatible schema.
