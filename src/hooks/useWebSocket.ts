import { useContext, useEffect, useRef } from 'react';
import { RealtimeContext, type RealtimeEvent } from '@/contexts/RealtimeContext';

export { resolveWsUrl } from '@/contexts/RealtimeContext';

/**
 * Runs `onMessageReceived` whenever the server broadcasts `eventName`.
 * Every caller shares the single connection opened by RealtimeProvider.
 */
export const useWebSocket = (eventName: RealtimeEvent, onMessageReceived: () => void) => {
  const realtime = useContext(RealtimeContext);
  const handlerRef = useRef(onMessageReceived);
  handlerRef.current = onMessageReceived;

  useEffect(() => {
    if (!realtime) return;
    return realtime.subscribe(eventName, () => handlerRef.current());
  }, [realtime, eventName]);
};
