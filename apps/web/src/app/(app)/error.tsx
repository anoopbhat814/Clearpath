'use client';

export default function SectionError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cp-alert cp-alert--danger" role="alert">
      <span>{error.message || 'This section failed to load.'}</span>
      <button className="cp-btn cp-btn--ghost" onClick={reset}>Retry</button>
    </div>
  );
}
