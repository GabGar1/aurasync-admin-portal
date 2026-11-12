import { logger } from '@/lib/logger';

export type RealtimeEvent = 'products_updated' | 'orders_updated';

/** The part of the browser WebSocket used here (a fake can stand in for tests). */
export interface SocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  close(): void;
}

export interface RealtimeOptions {
  url: string;
  createSocket?: (url: string) => SocketLike;
  /**
   * The server refused the handshake (or the network failed before it opened).
   * Answer 'stop' when the session is gone, 'retry' otherwise.
   */
  onHandshakeRejected: () => Promise<'retry' | 'stop'>;
  maxRetries?: number;
  baseDelayMs?: number;
}

/**
 * One WebSocket per signed-in session, shared by every screen. Screens subscribe to an
 * event; reconnection uses exponential backoff, and a refused handshake asks whether the
 * session is still valid before trying again.
 */
export class RealtimeConnection {
  private readonly handlers = new Map<RealtimeEvent, Set<() => void>>();
  private socket: SocketLike | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private stopped = true;
  private readonly createSocket: (url: string) => SocketLike;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(private readonly options: RealtimeOptions) {
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url) as unknown as SocketLike);
    this.maxRetries = options.maxRetries ?? 10;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  subscribe(event: RealtimeEvent, handler: () => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.retries = 0;
    this.connect();
  }

  stop() {
    this.stopped = true;
    this.clearTimer();
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }

  private clearTimer() {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.stopped || this.retries >= this.maxRetries) return;
    const delay = this.baseDelayMs * Math.pow(2, this.retries);
    this.retries += 1;
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }

  private connect() {
    if (this.stopped) return;
    let opened = false;
    const socket = this.createSocket(this.options.url);
    this.socket = socket;

    socket.onopen = () => {
      opened = true;
      this.retries = 0;
      this.clearTimer();
    };

    socket.onmessage = (message) => {
      let event: RealtimeEvent | undefined;
      try {
        event = JSON.parse(message.data)?.event;
      } catch (error) {
        logger.error('Erro ao processar mensagem do WebSocket:', error);
        return;
      }
      if (!event) return;
      this.handlers.get(event)?.forEach((handler) => handler());
    };

    socket.onclose = () => {
      if (this.stopped || this.socket !== socket) return;
      this.socket = null;
      if (opened) {
        this.scheduleReconnect();
        return;
      }
      // Never opened: refused (expired session) or network down. Check before retrying.
      this.clearTimer();
      this.options.onHandshakeRejected().then((decision) => {
        if (decision === 'stop') {
          this.stopped = true;
          return;
        }
        this.scheduleReconnect();
      });
    };

    socket.onerror = () => socket.close();
  }
}
