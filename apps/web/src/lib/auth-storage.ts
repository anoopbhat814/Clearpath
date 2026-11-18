import { SESSION_COOKIE, TOKEN_KEY } from './constants';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export function readTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

export function writeTokens(tokens: StoredTokens | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (tokens) window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage may be unavailable in private browsing; the session then lasts for this page only */
  }
  // Presence-only cookie used by middleware for routing; it carries no credentials.
  document.cookie = tokens
    ? `${SESSION_COOKIE}=1; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 8}`
    : `${SESSION_COOKIE}=; Path=/; SameSite=Strict; Max-Age=0`;
}
