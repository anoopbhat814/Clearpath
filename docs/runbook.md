# Operations runbook

## Health checks

| Check | Endpoint | Healthy |
| ----- | -------- | ------- |
| API liveness | `GET /api/health` | 200 `{status: "ok"}` |
| API readiness | `GET /api/health/ready` | 200 with database and Redis true |
| Analytics | `GET :8100/health` | 200 |
| Gateway | `GET :8200/healthz` | 200 |
| Gateway integrity | `GET :8200/v1/chain/verify` | `valid: true` |

## Common incidents

### Referrals stuck in SUBMITTED
Check the triage queue endpoint for SLA breaches, confirm the worker is running (digests are hourly), and inspect `queue:notifications:dead` for failed deliveries.

### Notifications not arriving
1. `LLEN queue:notifications` growing means the worker is down or blocked.
2. `LRANGE queue:notifications:dead 0 -1` shows jobs that exhausted retries and their `lastError`.
3. After fixing the cause, move dead jobs back with `RPOPLPUSH queue:notifications:dead queue:notifications` (repeat per job).

### Authorizations expired unexpectedly
The worker marks approved authorizations `EXPIRED` when `validUntil` passes. Review `authorization_events` for the system note "Expired automatically" and correct the validity date through a new approval transition if the payer extended coverage.

### Bed shows OCCUPIED with no patient
Find the open assignment (`bed_assignments` where `dischargedAt` is null). Discharge it through the API so the audit trail records the correction instead of editing rows directly.

### Analytics service unavailable
The API falls back to heuristic risk scores labelled `local-fallback`. Forecast endpoints return 5xx until the service is back; the web app shows an inline error.

### Audit chain verification fails
Treat as a security event. Preserve the gateway data volume, compare `audit-chain.jsonl` with the last known head hash, and compare against the `audit_logs` table, which is the system of record.

## Routine tasks

- **Audit retention**: `node scripts/prune-audit-logs.js --days 400 --dry-run`, then without `--dry-run`. Only `READ` events are removed.
- **Capacity snapshots**: stored in Redis (`capacity:snapshots:<wardId>`), trimmed to two weeks.
- **Key rotation**: rotate JWT secrets by deploying new values (users must sign in again) and rotate the gateway key on API and gateway together.
- **Backups**: back up PostgreSQL and the gateway volume together so the chain and database can be reconciled.
