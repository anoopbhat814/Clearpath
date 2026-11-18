'use client';

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="cp-pagination" aria-label="Pagination">
      <button className="cp-btn cp-btn--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="cp-muted">Page {page} of {totalPages}</span>
      <button className="cp-btn cp-btn--ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}
