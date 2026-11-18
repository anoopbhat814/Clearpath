// Package ingest validates and accepts audit event batches.
package ingest

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

var validActions = map[string]bool{
	"CREATE": true, "READ": true, "UPDATE": true, "DELETE": true, "LOGIN": true, "EXPORT": true,
}

// Event mirrors the envelope produced by the API's AuditForwarder.
type Event struct {
	ActorID    *string   `json:"actorId"`
	Action     string    `json:"action"`
	EntityType string    `json:"entityType"`
	EntityID   *string   `json:"entityId"`
	RequestID  string    `json:"requestId,omitempty"`
	OccurredAt time.Time `json:"occurredAt"`
}

// Validate returns a descriptive error when the event is not acceptable.
func (e Event) Validate(now time.Time) error {
	if !validActions[strings.ToUpper(e.Action)] {
		return fmt.Errorf("unknown action %q", e.Action)
	}
	if strings.TrimSpace(e.EntityType) == "" {
		return errors.New("entityType is required")
	}
	if len(e.EntityType) > 64 {
		return errors.New("entityType is too long")
	}
	if e.OccurredAt.IsZero() {
		return errors.New("occurredAt is required")
	}
	if e.OccurredAt.After(now.Add(5 * time.Minute)) {
		return errors.New("occurredAt is in the future")
	}
	if e.OccurredAt.Before(now.Add(-72 * time.Hour)) {
		return errors.New("occurredAt is older than the 72h acceptance window")
	}
	return nil
}
