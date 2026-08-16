import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

type WebSocketEvent = {
    event: 'products_updated' | 'orders_updated';
    message: string;
};

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3333';
const MAX_RETRIES = 10;
const BASE_DELAY = 1000;

export const useWebSocket = (eventName: WebSocketEvent['event'], onMessageReceived: () => void) => {
    const retryCountRef = useRef(0);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const disposedRef = useRef(false);

    useEffect(() => {
        disposedRef.current = false;

        function clearReconnectTimer() {
            if (reconnectTimeoutRef.current !== null) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        }

        function connect() {
            if (disposedRef.current) return;

            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
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
                if (wsRef.current === ws && !disposedRef.current && retryCountRef.current < MAX_RETRIES) {
                    const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
                    retryCountRef.current += 1;
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
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
    }, [eventName, onMessageReceived]);
};
