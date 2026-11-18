# Audit gateway

A small Go service that ingests audit events from the Clearpath API.

- `POST /v1/events/batch` accepts `{"events": [...]}` signed with an HMAC-SHA256 of the raw body in the `X-Clearpath-Signature` header.
- Accepted events are appended to a hash chain (each record stores the hash of the previous one) and written as JSON lines to `AUDIT_GATEWAY_DATA_DIR/audit-chain.jsonl`.
- `GET /v1/chain/verify` recomputes the chain and reports the first broken link, if any.
- `GET /healthz` is the liveness probe.

```bash
go run ./cmd/gateway
go test ./...
```
