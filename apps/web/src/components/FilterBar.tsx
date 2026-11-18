'use client';

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterBar({
  query,
  onQuery,
  hint = 'Search',
  selects = [],
}: {
  query: string;
  onQuery: (value: string) => void;
  hint?: string;
  selects?: { name: string; label: string; value: string; options: FilterOption[]; onChange: (value: string) => void }[];
}) {
  return (
    <div className="cp-filter-bar" role="search">
      <input
        className="cp-input"
        type="search"
        value={query}
        aria-label={hint} title={hint}
        onChange={(e) => onQuery(e.target.value)}
      />
      {selects.map((s) => (
        <label key={s.name} className="cp-select">
          <span className="cp-sr-only">{s.label}</span>
          <select value={s.value} onChange={(e) => s.onChange(e.target.value)} aria-label={s.label}>
            <option value="">{s.label}: all</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
