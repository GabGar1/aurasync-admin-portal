import { useEffect } from 'react';

type WebSocketEvent = {
    event: 'products_updated' | 'orders_updated';
    message: string;
};

export const useWebSocket = (eventName: WebSocketEvent['event'], onMessageReceived: () => void) => {
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3333');

        ws.onopen = () => {
            console.log('Conectado ao WebSocket do AuraSync');
        };

        ws.onmessage = (messageEvent) => {
            try {
                const data: WebSocketEvent = JSON.parse(messageEvent.data);

                // Se o evento recebido for o que este componente está esperando, executa a função
                if (data.event === eventName) {
                    console.log(`Evento recebido: ${data.message}`);
                    onMessageReceived();
                }
            } catch (error) {
                console.error('Erro ao processar mensagem do WebSocket:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };

        ws.onclose = () => {
            console.log('Conexão WebSocket fechada');
        };

        return () => {
            ws.close();
        };
    }, [eventName, onMessageReceived]);
};