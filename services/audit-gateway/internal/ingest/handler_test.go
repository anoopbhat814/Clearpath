package ingest

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/your-org/clearpath/audit-gateway/internal/signing"
	"github.com/your-org/clearpath/audit-gateway/internal/store"
)

const key = "unit-test-signing-key"

var fixedNow = time.Date(2026, 6, 1, 12, 0, 0, 0, time.UTC)

func newHandler() *Handler {
	return &Handler{
		Chain: store.New(nil), SigningKey: key, MaxBatch: 3, MaxBodyBytes: 4096,
		Now: func() time.Time { return fixedNow },
	}
}

func event(action string, at time.Time) map[string]any {
	return map[string]any{"actorId": "u1", "action": action, "entityType": "Patient", "entityId": "p1", "occurredAt": at.Format(time.RFC3339)}
}

func post(h *Handler, events []map[string]any, sign bool) *httptest.ResponseRecorder {
	body, _ := json.Marshal(map[string]any{"events": events})
	req := httptest.NewRequest(http.MethodPost, "/v1/events/batch", bytes.NewReader(body))
	if sign {
		req.Header.Set(SignatureHeader, signing.Sign(body, key))
	}
	rec := httptest.NewRecorder()
	h.Batch(rec, req)
	return rec
}

func TestBatchAcceptsValidEvents(t *testing.T) {
	h := newHandler()
	rec := post(h, []map[string]any{event("READ", fixedNow), event("UPDATE", fixedNow)}, true)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body)
	}
	if h.Chain.Len() != 2 {
		t.Fatalf("chain length = %d", h.Chain.Len())
	}
}

func TestBatchRejectsBadSignature(t *testing.T) {
	h := newHandler()
	if rec := post(h, []map[string]any{event("READ", fixedNow)}, false); rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d", rec.Code)
	}
	if h.Chain.Len() != 0 {
		t.Fatal("nothing may be stored for unsigned requests")
	}
}

func TestBatchReportsPartialRejections(t *testing.T) {
	h := newHandler()
	rec := post(h, []map[string]any{event("READ", fixedNow), event("TELEPORT", fixedNow), event("READ", fixedNow.Add(-100*time.Hour))}, true)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d", rec.Code)
	}
	var resp batchResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp.Accepted != 1 || len(resp.Rejected) != 2 {
		t.Fatalf("unexpected response %+v", resp)
	}
	if !strings.Contains(resp.Rejected[0].Error, "unknown action") {
		t.Fatalf("unexpected rejection %+v", resp.Rejected[0])
	}
}

func TestBatchEnforcesLimits(t *testing.T) {
	h := newHandler()
	many := []map[string]any{event("READ", fixedNow), event("READ", fixedNow), event("READ", fixedNow), event("READ", fixedNow)}
	if rec := post(h, many, true); rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("oversized batch status = %d", rec.Code)
	}
	if rec := post(h, nil, true); rec.Code != http.StatusBadRequest {
		t.Fatalf("empty batch status = %d", rec.Code)
	}
}

func TestVerifyEndpointReportsValidChain(t *testing.T) {
	h := newHandler()
	post(h, []map[string]any{event("READ", fixedNow)}, true)
	rec := httptest.NewRecorder()
	h.Verify(rec, httptest.NewRequest(http.MethodGet, "/v1/chain/verify", nil))
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if out["valid"] != true || out["records"].(float64) != 1 {
		t.Fatalf("unexpected verify output %v", out)
	}
}

