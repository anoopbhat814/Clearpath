# Contributing to Clearpath

Thanks for helping improve care coordination tooling.

## Getting set up

```bash
cp .env.example .env
make install
make db-up
make db-migrate db-seed
make dev
```

Use `make check-env` to verify your environment variables before starting the stack.

## Workflow

1. Fork and create a branch named `feat/<topic>` or `fix/<topic>`.
2. Keep changes focused; one logical change per pull request.
3. Add or update tests. API services use Jest specs next to the code (`*.spec.ts`), the analytics service uses pytest, and the audit gateway uses `go test`.
4. Run `make lint test` before pushing.
5. Update `docs/` and `CHANGELOG.md` for user-visible changes.

## Commit messages

We use Conventional Commits: `feat(referrals): add urgent triage queue`.

## Database changes

- Edit `prisma/schema.prisma` and create a timestamped folder under `prisma/migrations/`.
- Migrations must be forward-only; the `migrations-check` workflow fails if the schema and migrations drift.
- Never include real data in seeds. Use `*.example` email addresses and invented names.

## Code style

- TypeScript strict mode, Prettier (`npm run format`) and ESLint.
- Controllers stay thin; business rules live in services or pure functions that are unit-tested.
- Every mutating endpoint must be covered by the audit interceptor.

## Reporting bugs

Use the issue templates. Do not include patient information of any kind.
