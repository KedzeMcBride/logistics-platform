import type { AuthResponse } from '@repo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const ACCESS_TOKEN_KEY = 'logistics.accessToken';
const REFRESH_TOKEN_KEY = 'logistics.refreshToken';

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

export const tokenStore = {
  getAccess(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ---------------------------------------------------------------------------
// Internal: raw fetch that returns parsed JSON or throws ApiClientError
// ---------------------------------------------------------------------------

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  /** Internal: prevents infinite loop on refresh */
  _retry?: boolean;
};

async function rawFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.auth) {
    const token = tokenStore.getAccess();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // 204 No Content — nothing to parse
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const apiError: ApiError = {
      status: res.status,
      code: data?.error?.code ?? data?.code ?? 'UNKNOWN',
      message: data?.error?.message ?? data?.message ?? res.statusText,
      details: data?.error?.details ?? data?.details,
    };
    throw new ApiClientError(apiError);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Refresh: called automatically when a 401 happens on an authed request
// ---------------------------------------------------------------------------

let refreshPromise: Promise<AuthResponse> | null = null;

async function refreshTokens(): Promise<AuthResponse> {
  // De-dupe concurrent refreshes
  if (refreshPromise) return refreshPromise;

  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    throw new ApiClientError({
      status: 401,
      code: 'NO_REFRESH_TOKEN',
      message: 'Not authenticated',
    });
  }

  refreshPromise = (async () => {
    try {
      const tokens = await rawFetch<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: { refreshToken },
        },
      );
      tokenStore.set(tokens.accessToken, tokens.refreshToken);
      // Refetch user for the new access token
      const me = await rawFetch<AuthResponse['user']>('/users/me', {
        method: 'GET',
        auth: true,
      });
      return { ...tokens, user: me };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Public API client
// ---------------------------------------------------------------------------

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    try {
      return await rawFetch<T>(path, options);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401 && options.auth && !options._retry) {
        // Try to refresh and retry once
        try {
          await refreshTokens();
          return await rawFetch<T>(path, { ...options, _retry: true });
        } catch {
          tokenStore.clear();
          throw err;
        }
      }
      throw err;
    }
  },

  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  },
};
