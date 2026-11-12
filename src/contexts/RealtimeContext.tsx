import { createContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { RealtimeConnection, type RealtimeEvent } from '@/lib/realtime';

export type { RealtimeEvent };

export interface RealtimeContextValue {
  subscribe: (event: RealtimeEvent, handler: () => void) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function resolveWsUrl(configured: string | undefined, apiUrl: string | undefined, protocol: string, host: string): string {
  if (configured) return configured;
  if (apiUrl?.startsWith('http')) {
    const url = new URL(apiUrl);
    return `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`;
  }
  return protocol === 'https:' ? `wss://${host}` : 'ws://localhost:3333';
}

/** Owns the single realtime connection of the signed-in session. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const connection = useMemo(
    () =>
      new RealtimeConnection({
        url: resolveWsUrl(import.meta.env.VITE_WS_URL, import.meta.env.VITE_API_URL, window.location.protocol, window.location.host),
        onHandshakeRejected: async () => {
          try {
            await authApi.getMe();
            return 'retry';
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 401) {
              logger.warn('WebSocket negado e sessão inválida (401). Finalizando sessão.');
              void logoutRef.current();
              return 'stop';
            }
            return 'retry'; // API unreachable: keep retrying with backoff, do not sign out
          }
        },
      }),
    []
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    connection.start();
    return () => connection.stop();
  }, [connection, isAuthenticated]);

  const value = useMemo<RealtimeContextValue>(() => ({ subscribe: (event, handler) => connection.subscribe(event, handler) }), [connection]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
