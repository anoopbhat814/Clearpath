package ingest

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/your-org/clearpath/audit-gateway/internal/signing"
	"github.com/your-org/clearpath/audit-gateway/internal/store"
)

// SignatureHeader carries the HMAC of the raw request body.
const SignatureHeader = "X-Clearpath-Signature"

// Handler serves the ingestion and verification endpoints.
type Handler struct {
	Chain        *store.Chain
	SigningKey   string
	MaxBatch     int
	MaxBodyBytes int64
	Now          func() time.Time
}

type batchRequest struct {
	Events []json.RawMessage `json:"events"`
}

// Rejection describes an event that was not accepted.
type Rejection struct {
	Index int    `json:"index"`
	Error string `json:"error"`
}

type batchResponse struct {
	Accepted int         `json:"accepted"`
	Rejected []Rejection `json:"rejected,omitempty"`
	Head     string      `json:"head"`
}

func (h *Handler) now() time.Time {
	if h.Now != nil {
		return h.Now()
	}
	return time.Now()
}

// Batch handles POST /v1/events/batch.
func (h *Handler) Batch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, h.MaxBodyBytes))
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "body too large"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unreadable body"})
		return
	}
	if !signing.Verify(body, r.Header.Get(SignatureHeader), h.SigningKey) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid signature"})
		return
	}

	var req batchRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "malformed JSON"})
		return
	}
	if len(req.Events) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "no events supplied"})
		return
	}
	if len(req.Events) > h.MaxBatch {
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "batch exceeds maximum size"})
		return
	}

	now := h.now()
	var accepted []json.RawMessage
	var rejected []Rejection
	for i, raw := range req.Events {
		var ev Event
		if err := json.Unmarshal(raw, &ev); err != nil {
			rejected = append(rejected, Rejection{Index: i, Error: "malformed event"})
			continue
		}
		if err := ev.Validate(now); err != nil {
			rejected = append(rejected, Rejection{Index: i, Error: err.Error()})
			continue
		}
		accepted = append(accepted, raw)
	}

	head := h.Chain.Head()
	if len(accepted) > 0 {
		if head, err = h.Chain.Append(accepted); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to persist events"})
			return
		}
	}
	status := http.StatusAccepted
	if len(accepted) == 0 {
		status = http.StatusUnprocessableEntity
	}
	writeJSON(w, status, batchResponse{Accepted: len(accepted), Rejected: rejected, Head: head})
}

// Verify handles GET /v1/chain/verify.
func (h *Handler) Verify(w http.ResponseWriter, _ *http.Request) {
	recs := h.Chain.Snapshot()
	broken, err := store.Verify(recs)
	resp := map[string]any{"records": len(recs), "head": h.Chain.Head(), "valid": err == nil}
	if err != nil {
		resp["brokenAt"] = broken
		resp["error"] = err.Error()
	}
	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
