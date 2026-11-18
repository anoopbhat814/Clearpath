package store

import (
	"encoding/json"
	"errors"
	"testing"
)

func events(n int) []json.RawMessage {
	out := make([]json.RawMessage, n)
	for i := range out {
		out[i] = json.RawMessage(`{"action":"READ","entityType":"Patient"}`)
	}
	return out
}

func TestAppendBuildsLinkedChain(t *testing.T) {
	c := New(nil)
	head, err := c.Append(events(3))
	if err != nil {
		t.Fatal(err)
	}
	if c.Len() != 3 || head != c.Head() {
		t.Fatalf("unexpected state len=%d head=%s", c.Len(), head)
	}
	recs := c.Snapshot()
	if recs[1].PrevHash != recs[0].Hash {
		t.Fatal("second record must link to the first")
	}
	if broken, err := Verify(recs); err != nil || broken != 0 {
		t.Fatalf("expected a valid chain, got broken=%d err=%v", broken, err)
	}
}

func TestVerifyDetectsEditedEvent(t *testing.T) {
	c := New(nil)
	_, _ = c.Append(events(4))
	recs := c.Snapshot()
	recs[2].Event = json.RawMessage(`{"action":"DELETE"}`)
	broken, err := Verify(recs)
	if err == nil || broken != 3 {
		t.Fatalf("expected break at 3, got %d (%v)", broken, err)
	}
}

func TestVerifyDetectsRemovedRecord(t *testing.T) {
	c := New(nil)
	_, _ = c.Append(events(4))
	recs := c.Snapshot()
	recs = append(recs[:1], recs[2:]...)
	if broken, err := Verify(recs); err == nil || broken == 0 {
		t.Fatalf("expected removal to be detected, got %d (%v)", broken, err)
	}
}

type failingWriter struct{}

func (failingWriter) Write([]byte) (int, error) { return 0, errors.New("disk full") }

func TestAppendSurfacesPersistenceErrors(t *testing.T) {
	c := New(failingWriter{})
	if _, err := c.Append(events(1)); err == nil {
		t.Fatal("expected a persistence error")
	}
	if c.Len() != 0 {
		t.Fatal("a record that failed to persist must not enter the chain")
	}
}
