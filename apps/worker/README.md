# Clearpath worker

Background processing for Clearpath. The worker has two responsibilities:

1. **Queue consumers** (Redis lists named `queue:<name>`): `notifications` creates in-app notifications and sends email; failed jobs are retried with backoff and finally moved to `queue:<name>:dead`.
2. **Scheduled jobs**: referral triage reminders, prior-authorization expiry warnings, and periodic bed-capacity snapshots.

## Running

```bash
cp .env.example .env
node src/index.js
```

## Tests

```bash
npx jest --selectProjects worker
```
