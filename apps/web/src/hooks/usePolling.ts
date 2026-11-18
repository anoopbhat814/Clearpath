'use client';

import { useEffect, useRef } from 'react';
import { POLL_INTERVAL_MS } from '@/lib/constants';

/** Calls `callback` on an interval while the tab is visible. */
export function usePolling(callback: () => void, intervalMs = POLL_INTERVAL_MS) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') saved.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
