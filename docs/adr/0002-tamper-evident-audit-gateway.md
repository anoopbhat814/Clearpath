# ADR 0002: Separate audit gateway with a hash chain

**Status**: Accepted

## Context
Audit records in the application database can be altered by anyone with database access. Reviewers need a way to detect that.

## Decision
The API writes audit rows to PostgreSQL (system of record) and forwards signed batches to a small Go gateway. The gateway appends each event to a chain where every record contains the hash of its predecessor and persists it as JSON lines.

## Consequences
- Edits, deletions and reordering of gateway records are detectable with `GET /v1/chain/verify`.
- Forwarding is best effort; PostgreSQL remains authoritative if the gateway is down.
- Operators who need stronger guarantees should periodically anchor the head hash in an external system.
