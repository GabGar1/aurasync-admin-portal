import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

type WebSocketEvent = {
    event: 'products_updated' | 'orders_updated';
    message: string;
};

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://localhost:3333';
const MAX_RETRIES = 10;
const BASE_DELAY = 1000;

export const useWebSocket = (eventName: WebSocketEvent['event'], onMessageReceived: () => void) => {
    const retryCountRef = useRef(0);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        function connect() {
            wsRef.current = new WebSocket(WS_URL);

            wsRef.current.onopen = () => {
                retryCountRef.current = 0;
            };

            wsRef.current.onmessage = (messageEvent) => {
                try {
                    const data: WebSocketEvent = JSON.parse(messageEvent.data);
                    if (data.event === eventName) {
                        onMessageReceived();
                    }
                } catch (error) {
                    logger.error('Erro ao processar mensagem do WebSocket:', error);
                }
            };

            wsRef.current.onclose = () => {
                if (retryCountRef.current < MAX_RETRIES) {
                    const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
                    retryCountRef.current += 1;
                    setTimeout(connect, delay);
                }
            };

            wsRef.current.onerror = () => {
                wsRef.current?.close();
            };
        }

        connect();

        return () => {
            wsRef.current?.close();
        };
    }, [eventName, onMessageReceived]);
};
