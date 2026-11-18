# ADR 0001: Modular NestJS monolith for the core API

**Status**: Accepted

## Context
Referrals, authorizations, capacity and scheduling share patients, providers and users. Splitting them into separate services would force distributed transactions for workflows like admitting a patient to a bed.

## Decision
Implement the core as one NestJS application with strict module boundaries (controller, service, DTOs, pure rule functions per domain). Extract only components with different runtime needs: analytics (Python), audit ingestion (Go) and background processing (worker).

## Consequences
- Single transaction scope for multi-entity operations.
- Simple local development and deployment.
- Module boundaries must be maintained by convention and review; a module may be extracted later because services depend on Prisma, not on each other.
