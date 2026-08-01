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
      } catch {
        logout();
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(id);
  }, [logout]);
}
