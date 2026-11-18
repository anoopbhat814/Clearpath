'use client';

export default function TasksError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cp-alert cp-alert--danger" role="alert">
      <span>{error.message || 'Unable to load task boards.'}</span>
      <button className="cp-btn cp-btn--ghost" onClick={reset}>Retry</button>
    </div>
  );
}
