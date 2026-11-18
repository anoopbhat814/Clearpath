# Security and compliance considerations

Clearpath handles information that many deployments will treat as protected health information (PHI). This document lists the technical controls the project provides and the responsibilities that remain with the operator. **The project does not claim certification or compliance with any regulation or standard.** Compliance depends on how a deployment is configured, hosted, staffed and governed.

## Threat model summary

| Asset | Main risks | Primary controls |
| ----- | ---------- | ---------------- |
| Patient and referral data | Unauthorized access, bulk export | Role-based access, audited reads, rate limiting, minimal list projections |
| Credentials and tokens | Theft, replay | bcrypt hashing, short-lived access tokens, rotating hashed refresh tokens |
| Audit trail | Tampering, deletion | Append-only writes, signed ingestion, hash-chained gateway store |
| Integrations | Spoofed events | HMAC signature on gateway ingestion |

## Implemented controls

### Authentication and sessions
- Passwords are hashed with bcrypt (cost configurable through `BCRYPT_ROUNDS`) and checked against a strength policy (length, case, digit) when users are created.
- Login errors are identical for unknown users and wrong passwords.
- Access tokens expire after 15 minutes. Refresh tokens are random 48-byte values stored as SHA-256 digests, rotated on every use and revocable on logout.
- Secrets must be at least 32 characters and the two JWT secrets must differ; the API refuses to start otherwise (`env.validation.ts`).

### Authorization
- A global JWT guard protects every route except those explicitly marked `@Public()`.
- Roles (`ADMIN`, `COORDINATOR`, `CLINICIAN`, `SCHEDULER`, `BED_MANAGER`, `ANALYST`, `AUDITOR`) are enforced per route by `RolesGuard`. Directory entities (users, facilities, insurance plans) are scoped to the caller's organization.
- The web app hides navigation by role for usability; the API is the only enforcement point.

### Auditing
- `AuditInterceptor` records reads and writes for audited controllers with actor, entity, IP and request id.
- Exports of the audit trail are themselves audited, and CSV output neutralizes spreadsheet formula injection.
- The Go gateway accepts only HMAC-signed batches, rejects events outside a 72-hour window, and appends to a hash chain. `GET /v1/chain/verify` detects edited, removed or reordered records.
- `scripts/prune-audit-logs.js` only removes `READ` rows past retention, never mutating events.

### Application hardening
- `helmet`, strict CORS origins, request body validation with `whitelist` and `forbidNonWhitelisted`, and a throttler (300 requests per minute per client by default).
- Error responses never include stack traces or database messages.
- The web app sets security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) and keeps tokens in `sessionStorage`; the presence cookie used by middleware carries no credentials.
- Notification emails contain no patient details by contract.

### Data handling
- Seeds, fixtures and tests use invented people and `*.example` addresses only.
- Analytics receives aggregated numeric features, not names or identifiers.

## Operator responsibilities

These are not provided by the code and must be addressed by whoever deploys Clearpath:

1. **Transport and storage encryption**: terminate TLS in front of every service, enable encryption at rest for PostgreSQL, Redis snapshots, backups and the gateway data volume.
2. **Key management**: store secrets in a secret manager, rotate JWT and gateway keys, and restrict who can read them.
3. **Identity**: consider SSO and multi-factor authentication through your identity provider; the built-in password login is a baseline.
4. **Network policy**: keep PostgreSQL, Redis and the side services off the public internet; only the web and API ingress should be reachable.
5. **Retention and disposal**: define audit and clinical data retention and configure pruning and backups accordingly.
6. **Access review**: periodically review roles and audit exports.
7. **Agreements and risk analysis**: obtain the agreements and perform the risk assessments your jurisdiction and customers require.
8. **Monitoring**: ship logs (which include request ids but not payloads) to a monitored system and alert on authentication failures and audit chain verification failures.
9. **Clinical safety**: risk scores and forecasts are decision support and must not replace clinical judgment.

## Known limitations

- Role checks are coarse (route level). Row-level restrictions such as "only assigned clinicians" are not implemented.
- Access tokens are bearer tokens held in the browser session; a deployment with stricter requirements should move to server-side sessions or a backend-for-frontend pattern.
- The gateway chain is tamper-evident but not tamper-proof: anchor the head hash externally if you need stronger guarantees.

## Reporting

See [SECURITY.md](../SECURITY.md) for how to report vulnerabilities.
