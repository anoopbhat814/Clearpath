'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="cp-login">
      <div className="cp-card" role="alert">
        <h1>Something went wrong</h1>
        <p className="cp-muted">{error.digest ? `Reference ${error.digest}` : 'An unexpected error occurred.'}</p>
        <button className="cp-btn" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
