# Development guide

## Prerequisites

Node 20, Python 3.12, Go 1.22, Docker with Compose.

## First run

```bash
cp .env.example .env
make install
make db-up
make db-migrate db-seed
make dev          # API :4000, web :3000, worker
```

Sign in with `coordinator@clearpath.example` and the password printed by the seed script.

Run the side services in separate terminals when you need them:

```bash
make analytics    # FastAPI on :8100
make gateway      # Go gateway on :8200 (requires AUDIT_GATEWAY_SIGNING_KEY)
```

## Testing

| Area | Command |
| ---- | ------- |
| API, worker, shared utilities, web helpers | `npm test` |
| Coverage | `npm run test:cov` |
| Analytics | `cd services/analytics && pytest` |
| Gateway | `cd services/audit-gateway && go test ./...` |
| Everything | `make test` |

Unit specs mock Prisma and sit beside the code. Controller-level behavior is covered by the supertest suites in `apps/api/test`.

## Adding an API module

1. Create `apps/api/src/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts` and `*.service.spec.ts`.
2. Mark the controller `@Audited('<Entity>')` and add `@Roles(...)` to mutating routes.
3. Register the module in `app.module.ts`.
4. Put non-trivial rules in a pure function with its own spec.
5. Document the routes in `docs/api.md`.

## Changing the schema

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name <change>` creates the timestamped folder.
3. Update `prisma/seed.ts` and `docs/data-model.md` if relevant.
4. `node scripts/verify-migrations.js` checks naming and ordering.

## Conventions

- Strict TypeScript, Prettier and ESLint (`make lint`, `make format`).
- Conventional Commits.
- No real patient data anywhere; use `*.example` addresses and invented names.
