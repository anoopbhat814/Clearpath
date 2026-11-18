// Package signing implements the HMAC scheme shared with the Clearpath API.
package signing

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

// Sign returns the lowercase hex HMAC-SHA256 of body under key.
func Sign(body []byte, key string) string {
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

// Verify checks a presented signature in constant time. An optional "sha256=" prefix is accepted.
func Verify(body []byte, presented, key string) bool {
	presented = strings.TrimPrefix(strings.TrimSpace(presented), "sha256=")
	want, err := hex.DecodeString(Sign(body, key))
	if err != nil {
		return false
	}
	got, err := hex.DecodeString(presented)
	if err != nil {
		return false
	}
	return hmac.Equal(want, got)
}
