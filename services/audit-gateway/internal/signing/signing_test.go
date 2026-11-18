package signing

import "testing"

func TestSignIsDeterministic(t *testing.T) {
	a := Sign([]byte(`{"events":[]}`), "k")
	b := Sign([]byte(`{"events":[]}`), "k")
	if a != b || len(a) != 64 {
		t.Fatalf("unexpected signature %q", a)
	}
}

func TestVerify(t *testing.T) {
	body := []byte("payload")
	sig := Sign(body, "secret")
	cases := []struct {
		name string
		sig  string
		key  string
		want bool
	}{
		{"valid", sig, "secret", true},
		{"prefixed", "sha256=" + sig, "secret", true},
		{"wrong key", sig, "other", false},
		{"not hex", "zzzz", "secret", false},
		{"empty", "", "secret", false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := Verify(body, c.sig, c.key); got != c.want {
				t.Fatalf("Verify = %v, want %v", got, c.want)
			}
		})
	}
}

func TestVerifyDetectsTampering(t *testing.T) {
	sig := Sign([]byte("original"), "secret")
	if Verify([]byte("modified"), sig, "secret") {
		t.Fatal("tampered body must not verify")
	}
}
