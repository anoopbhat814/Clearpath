'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import type { QueryValue } from '@/lib/query';

export interface ApiState<T> {
  data: T | null;
  error: ApiRequestError | Error | null;
  loading: boolean;
  reload: () => void;
}

/** Minimal fetch hook: cancels stale responses and exposes a manual reload. */
export function useApi<T>(path: string | null, params: Record<string, QueryValue> = {}): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiState<T>['error']>(null);
  const [loading, setLoading] = useState(path !== null);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const key = JSON.stringify(params);

  useEffect(() => {
    if (path === null) return;
    const mine = ++seq.current;
    setLoading(true);
    api
      .get<T>(path, JSON.parse(key))
      .then((res) => {
        if (mine === seq.current) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => mine === seq.current && setError(err))
      .finally(() => mine === seq.current && setLoading(false));
  }, [path, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
