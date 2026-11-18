export type QueryValue = string | number | boolean | undefined | null;

/** Serializes a params object, dropping empty values. */
export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function parseQueryString(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search).entries());
}
