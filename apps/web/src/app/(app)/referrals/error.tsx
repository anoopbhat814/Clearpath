'use client';

export default function ReferralsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cp-alert cp-alert--danger" role="alert">
      <span>{error.message || 'Unable to load referrals.'}</span>
      <button className="cp-btn cp-btn--ghost" onClick={reset}>Retry</button>
    </div>
  );
}
