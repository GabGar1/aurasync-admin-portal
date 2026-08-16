import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/api';

const CHECK_INTERVAL = 60_000;

export default function useTokenExpirationWatcher() {
  const { logout } = useAuth();

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await authApi.getMe();
      } catch (err) {
        if ((err as { response?: { status?: unknown } })?.response?.status === 401) {
          logout();
        }
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(id);
  }, [logout]);

  return null;
}
