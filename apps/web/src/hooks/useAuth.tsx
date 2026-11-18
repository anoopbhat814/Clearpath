'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SessionUser } from '@clearpath/shared-types';
import { api } from '@/lib/api';
import { readTokens } from '@/lib/auth-storage';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const USER_KEY = 'cp.user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(USER_KEY);
      if (raw && readTokens()) setUser(JSON.parse(raw));
    } catch {
      /* ignore unreadable session */
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    try {
      window.sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      /* non-fatal */
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    try {
      window.sessionStorage.removeItem(USER_KEY);
    } catch {
      /* non-fatal */
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
