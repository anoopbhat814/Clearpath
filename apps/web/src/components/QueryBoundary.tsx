'use client';

import type { ReactNode } from 'react';
import type { ApiState } from '@/hooks/useApi';

export function QueryBoundary<T>({ state, children }: { state: ApiState<T>; children: (data: T) => ReactNode }) {
  if (state.loading && !state.data) return <p className="cp-muted" role="status">Loading…</p>;
  if (state.error) {
    return (
      <div className="cp-alert cp-alert--danger" role="alert">
        <strong>Something went wrong.</strong> {state.error.message}
        <button className="cp-btn cp-btn--ghost" onClick={state.reload}>Retry</button>
      </div>
    );
  }
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}
