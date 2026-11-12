import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { storedUserSchema } from '@/lib/schemas';
import { homePathFor } from '@/lib/permissions';
import type { User } from '@/types';

const USER_KEY = 'aurasync_user';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** Kept for existing callers; prefer `user`. */
  getUser: () => User | null;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads the session from the API (the httpOnly cookie is the real session). */
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** localStorage only caches the profile for the first paint; /auth/me always confirms it. */
function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const result = storedUserSchema.safeParse(JSON.parse(raw));
    return result.success ? (result.data as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // storage unavailable (private mode): the session still works from the cookie
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(readCachedUser);
  const [ready, setReady] = useState(false);

  const applyUser = useCallback((next: User | null) => {
    cacheUser(next);
    setUser(next);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      applyUser(await authApi.getMe());
      await authApi.getCsrfToken().catch(() => undefined);
    } catch {
      applyUser(null);
    }
  }, [applyUser]);

  useEffect(() => {
    refreshAuth().finally(() => setReady(true));
  }, [refreshAuth]);

  const login = useCallback(async (next: User) => {
    applyUser(next);
    await authApi.getCsrfToken().catch(() => undefined);
    navigate(homePathFor(next.role));
  }, [applyUser, navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // the local session is cleared even if the API is unreachable
    }
    applyUser(null);
    navigate('/login');
  }, [applyUser, navigate]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    getUser: () => user,
    login,
    logout,
    refreshAuth,
  }), [user, login, logout, refreshAuth]);

  if (!ready) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
