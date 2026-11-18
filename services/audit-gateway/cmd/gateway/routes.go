package main

import (
	"net/http"
	"time"

	"github.com/your-org/clearpath/audit-gateway/internal/config"
	"github.com/your-org/clearpath/audit-gateway/internal/ingest"
	"github.com/your-org/clearpath/audit-gateway/internal/store"
)

// newMux wires the HTTP routes around a chain.
func newMux(cfg config.Config, chain *store.Chain) http.Handler {
	h := &ingest.Handler{Chain: chain, SigningKey: cfg.SigningKey, MaxBatch: cfg.MaxBatch, MaxBodyBytes: cfg.MaxBodyBytes}
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/v1/events/batch", h.Batch)
	mux.HandleFunc("/v1/chain/verify", h.Verify)
	return withTimeout(mux, 15*time.Second)
}

func withTimeout(next http.Handler, d time.Duration) http.Handler {
	return http.TimeoutHandler(next, d, `{"error":"request timed out"}`)
}
