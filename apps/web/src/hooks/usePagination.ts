'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export function usePagination(pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const reset = useCallback(() => setPage(1), []);
  const next = useCallback((totalPages: number) => setPage((p) => Math.min(p + 1, totalPages)), []);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  return { page, pageSize, setPage, reset, next, prev };
}
