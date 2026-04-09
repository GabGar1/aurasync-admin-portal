import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';

const TOKEN_KEY = 'aurasync_token';
const USER_KEY = 'aurasync_user';

export function useAuth() {
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getUser = (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  };
  const isAuthenticated = !!getToken();

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    navigate('/');
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    navigate('/login');
  }, [navigate]);

  return { getToken, getUser, isAuthenticated, login, logout };
}
