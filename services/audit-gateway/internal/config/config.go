// Package config loads gateway settings from the environment.
package config

import (
	"errors"
	"os"
	"strconv"
)

// Config holds runtime settings for the gateway.
type Config struct {
	Port         string
	SigningKey   string
	DataDir      string
	MaxBatch     int
	MaxBodyBytes int64
}

// FromEnv reads configuration and validates it.
func FromEnv() (Config, error) {
	c := Config{
		Port:         getenv("AUDIT_GATEWAY_PORT", "8200"),
		SigningKey:   os.Getenv("AUDIT_GATEWAY_SIGNING_KEY"),
		DataDir:      getenv("AUDIT_GATEWAY_DATA_DIR", "./data"),
		MaxBatch:     getenvInt("AUDIT_GATEWAY_MAX_BATCH", 500),
		MaxBodyBytes: int64(getenvInt("AUDIT_GATEWAY_MAX_BODY_BYTES", 1<<20)),
	}
	return c, c.Validate()
}

// Validate checks that required settings are present and sane.
func (c Config) Validate() error {
	if len(c.SigningKey) < 16 {
		return errors.New("AUDIT_GATEWAY_SIGNING_KEY must be at least 16 characters")
	}
	if c.MaxBatch < 1 || c.MaxBatch > 10000 {
		return errors.New("AUDIT_GATEWAY_MAX_BATCH must be between 1 and 10000")
	}
	if c.MaxBodyBytes < 1024 {
		return errors.New("AUDIT_GATEWAY_MAX_BODY_BYTES must be at least 1024")
	}
	return nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
