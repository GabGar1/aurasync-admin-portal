import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { storedUserSchema } from '@/lib/schemas';
import type { User } from '@/types';

const USER_KEY = 'aurasync_user';

function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function useAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem(USER_KEY));

  const getUser = (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const result = storedUserSchema.safeParse(parsed);
      if (!result.success) {
        clearUser();
        return null;
      }
      return result.data as User;
    } catch {
      clearUser();
      return null;
    }
  };

  const login = useCallback(async (token: string, user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setIsAuthenticated(true);
    try {
      await authApi.getCsrfToken();
    } catch {
      // CSRF initialization is best-effort
    }
    navigate('/');
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // proceed even if logout API fails
    }
    clearUser();
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  const refreshAuth = useCallback(async () => {
    try {
      const user = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setIsAuthenticated(true);
      await authApi.getCsrfToken();
    } catch {
      clearUser();
      setIsAuthenticated(false);
    }
  }, []);

  return { getUser, isAuthenticated, login, logout, refreshAuth };
}

export { clearUser as clearAuth };
