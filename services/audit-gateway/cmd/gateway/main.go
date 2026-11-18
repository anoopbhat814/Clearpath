// Command gateway ingests signed audit events into a tamper-evident chain.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/your-org/clearpath/audit-gateway/internal/config"
	"github.com/your-org/clearpath/audit-gateway/internal/store"
)

func main() {
	cfg, err := config.FromEnv()
	if err != nil {
		log.Fatalf("configuration error: %v", err)
	}
	if err := os.MkdirAll(cfg.DataDir, 0o750); err != nil {
		log.Fatalf("create data dir: %v", err)
	}
	f, err := os.OpenFile(filepath.Join(cfg.DataDir, "audit-chain.jsonl"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o640)
	if err != nil {
		log.Fatalf("open chain file: %v", err)
	}
	defer f.Close()

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           newMux(cfg, store.New(f)),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("audit gateway listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
