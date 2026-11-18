'use client';

export default function SchedulingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cp-alert cp-alert--danger" role="alert">
      <span>{error.message || 'Unable to load the schedule.'}</span>
      <button className="cp-btn cp-btn--ghost" onClick={reset}>Retry</button>
    </div>
  );
}
