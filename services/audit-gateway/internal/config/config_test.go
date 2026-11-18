package config

import "testing"

func TestFromEnvDefaults(t *testing.T) {
	t.Setenv("AUDIT_GATEWAY_SIGNING_KEY", "0123456789abcdef")
	t.Setenv("AUDIT_GATEWAY_PORT", "")
	c, err := FromEnv()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if c.Port != "8200" || c.MaxBatch != 500 {
		t.Fatalf("unexpected defaults: %+v", c)
	}
}

func TestValidateRejectsWeakKey(t *testing.T) {
	t.Setenv("AUDIT_GATEWAY_SIGNING_KEY", "short")
	if _, err := FromEnv(); err == nil {
		t.Fatal("expected an error for a short signing key")
	}
}

