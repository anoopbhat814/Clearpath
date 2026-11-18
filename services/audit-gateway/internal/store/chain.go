// Package store keeps accepted audit events in a tamper-evident hash chain.
package store

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"
)

// Record is one link of the chain.
type Record struct {
	Seq        uint64          `json:"seq"`
	ReceivedAt time.Time       `json:"receivedAt"`
	Event      json.RawMessage `json:"event"`
	PrevHash   string          `json:"prevHash"`
	Hash       string          `json:"hash"`
}

// Chain appends records and optionally mirrors them as JSON lines to a writer.
type Chain struct {
	mu      sync.Mutex
	records []Record
	last    string
	out     io.Writer
	now     func() time.Time
}

// New creates an empty chain. out may be nil.
func New(out io.Writer) *Chain {
	return &Chain{out: out, last: genesisHash, now: time.Now}
}

const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000"

func linkHash(seq uint64, prev string, event []byte) string {
	h := sha256.New()
	fmt.Fprintf(h, "%d|%s|", seq, prev)
	h.Write(event)
	return hex.EncodeToString(h.Sum(nil))
}

// Append adds events to the chain and returns the new head hash.
func (c *Chain) Append(events []json.RawMessage) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for _, ev := range events {
		seq := uint64(len(c.records)) + 1
		rec := Record{Seq: seq, ReceivedAt: c.now().UTC(), Event: ev, PrevHash: c.last}
		rec.Hash = linkHash(seq, rec.PrevHash, ev)
		if c.out != nil {
			line, err := json.Marshal(rec)
			if err != nil {
				return c.last, err
			}
			if _, err := c.out.Write(append(line, '\n')); err != nil {
				return c.last, fmt.Errorf("persist audit record: %w", err)
			}
		}
		c.records = append(c.records, rec)
		c.last = rec.Hash
	}
	return c.last, nil
}

// Len returns the number of records.
func (c *Chain) Len() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.records)
}

// Head returns the hash of the latest record.
func (c *Chain) Head() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.last
}

// Snapshot returns a copy of all records.
func (c *Chain) Snapshot() []Record {
	c.mu.Lock()
	defer c.mu.Unlock()
	out := make([]Record, len(c.records))
	copy(out, c.records)
	return out
}

// Verify recomputes every link. It returns the sequence number of the first broken record, or 0.
func Verify(records []Record) (brokenAt uint64, err error) {
	prev := genesisHash
	for i, r := range records {
		if r.Seq != uint64(i)+1 {
			return r.Seq, fmt.Errorf("record %d out of sequence", r.Seq)
		}
		if r.PrevHash != prev {
			return r.Seq, fmt.Errorf("record %d does not link to its predecessor", r.Seq)
		}
		if linkHash(r.Seq, r.PrevHash, r.Event) != r.Hash {
			return r.Seq, fmt.Errorf("record %d hash mismatch", r.Seq)
		}
		prev = r.Hash
	}
	return 0, nil
}
