# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.4.x   | Yes       |
| 1.3.x   | Security fixes only |
| < 1.3   | No        |

## Reporting a vulnerability

Please do not open a public issue for security problems. Email security@clearpath.example with:

- a description of the issue and its impact,
- reproduction steps or a proof of concept,
- the affected component (API, web, worker, analytics service, audit gateway).

We acknowledge reports within 3 business days and aim to provide a remediation plan within 14 days.

## Handling of health information

Clearpath processes data that deployments may classify as protected health information. The project provides technical controls (role-based access, field-level audit logging, encryption in transit, signed audit ingestion) but does not by itself make a deployment compliant with any regulation. See [docs/security.md](docs/security.md) for the control inventory and the responsibilities left to operators.

## Disclosure

We follow coordinated disclosure. Fixes are released with an entry in [CHANGELOG.md](CHANGELOG.md) and credit to the reporter unless anonymity is requested.
