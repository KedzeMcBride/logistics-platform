'use client';

import type { AuthResponse, AuthUser } from '@repo/shared';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient, ApiClientError, tokenStore } from '@/lib/api-client';

import type { AuthContextValue, RegisterInput } from './types';

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Session cookie helpers
// ---------------------------------------------------------------------------
// The cookie is a lightweight "logged in" flag used by Next.js middleware,
// which runs on the server and cannot read localStorage. Real tokens stay in
// localStorage; the cookie only signals session presence.

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'logistics.session=1; path=/; max-age=2592000; samesite=lax';
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'logistics.session=; path=/; max-age=0; samesite=lax';
}

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if we have tokens, fetch the user and sync the session cookie.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const access = tokenStore.getAccess();
      if (!access) {
        clearSessionCookie();
        setIsLoading(false);
        return;
      }

      try {
        const me = await apiClient.get<AuthUser>('/users/me', { auth: true });
        if (!cancelled) {
          setUser(me);
          setSessionCookie();
        }
      } catch {
        tokenStore.clear();
        clearSessionCookie();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    tokenStore.set(res.accessToken, res.refreshToken);
    setSessionCookie();
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', input);
    tokenStore.set(res.accessToken, res.refreshToken);
    setSessionCookie();
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefresh();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Ignore — we're logging out anyway
      }
    }
    tokenStore.clear();
    clearSessionCookie();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiClient.get<AuthUser>('/users/me', { auth: true });
      setUser(me);
      setSessionCookie();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        tokenStore.clear();
        clearSessionCookie();
        setUser(null);
      }
      throw err;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
