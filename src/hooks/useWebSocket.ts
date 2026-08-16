import { useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type WebSocketEvent = {
  event: 'products_updated' | 'orders_updated';
  message: string;
};

const MAX_RETRIES = 10;
const BASE_DELAY = 1000;

export function resolveWsUrl(configured: string | undefined, protocol: string, host: string): string {
  if (configured) return configured;
  return protocol === 'https:' ? `wss://${host}` : 'ws://localhost:3333';
}

const WS_URL = resolveWsUrl(import.meta.env.VITE_WS_URL, window.location.protocol, window.location.host);

export const useWebSocket = (eventName: WebSocketEvent['event'], onMessageReceived: () => void) => {
  const { isAuthenticated, logout } = useAuth();
  const retryCountRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    disposedRef.current = false;

    function clearReconnectTimer() {
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (disposedRef.current) return;
      const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }

    async function verifySessionAndReconnect() {
      if (disposedRef.current) return;
      try {
        await authApi.getMe();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          retryCountRef.current = 0;
          disposedRef.current = true;
          clearReconnectTimer();
          logger.warn('WebSocket negado e sessão inválida (401). Finalizando sessão.');
          logout();
          return;
        }
        // API fora do ar: tenta reconectar com backoff (não desloga por queda de rede)
        if (disposedRef.current) return;
        if (retryCountRef.current < MAX_RETRIES) {
          scheduleReconnect();
        }
        return;
      }
      // Sessão válida: reconecta respeitando o cap de tentativas (MAX_RETRIES)
      if (!disposedRef.current && retryCountRef.current < MAX_RETRIES) {
        scheduleReconnect();
      }
    }

    function connect() {
      if (disposedRef.current) return;

      let hasOpened = false;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        hasOpened = true;
        wsRef.current = ws;
        retryCountRef.current = 0;
        clearReconnectTimer();
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data: WebSocketEvent = JSON.parse(messageEvent.data);
          if (data.event === eventName) {
            onMessageReceived();
          }
        } catch (error) {
          logger.error('Erro ao processar mensagem do WebSocket:', error);
        }
      };

      ws.onclose = () => {
        if (disposedRef.current) return;
        wsRef.current = null;

        if (!hasOpened) {
          // handshake recusado (401) ou conectividade: revalida a sessão antes de decidir
          clearReconnectTimer();
          verifySessionAndReconnect();
          return;
        }

        if (retryCountRef.current < MAX_RETRIES) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposedRef.current = true;
      clearReconnectTimer();
      wsRef.current?.close();
    };
  }, [eventName, onMessageReceived, isAuthenticated, logout]);
};