import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealtimeConnection, type SocketLike } from './realtime';

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) {}
  open() { this.onopen?.(); }
  emit(data: unknown) { this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) }); }
  drop() { this.onclose?.(); }
  close() { this.closed = true; this.onclose?.(); }
}

let sockets: FakeSocket[];
const createSocket = (url: string) => {
  const s = new FakeSocket(url);
  sockets.push(s);
  return s;
};

beforeEach(() => {
  sockets = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const connection = (onHandshakeRejected: () => Promise<'retry' | 'stop'> = vi.fn(async () => 'retry' as const)) =>
  new RealtimeConnection({ url: 'ws://test', createSocket, onHandshakeRejected, baseDelayMs: 1000, maxRetries: 3 });

describe('RealtimeConnection', () => {
  it('usa um único socket para todos os assinantes e entrega só o evento assinado', () => {
    const rt = connection();
    const orders = vi.fn();
    const orders2 = vi.fn();
    const products = vi.fn();
    rt.subscribe('orders_updated', orders);
    rt.subscribe('orders_updated', orders2);
    rt.subscribe('products_updated', products);
    rt.start();
    sockets[0]!.open();

    sockets[0]!.emit({ event: 'orders_updated', message: 'x' });

    expect(sockets).toHaveLength(1);
    expect(orders).toHaveBeenCalledTimes(1);
    expect(orders2).toHaveBeenCalledTimes(1);
    expect(products).not.toHaveBeenCalled();
  });

  it('para de entregar depois de cancelar a assinatura', () => {
    const rt = connection();
    const handler = vi.fn();
    const unsubscribe = rt.subscribe('orders_updated', handler);
    rt.start();
    sockets[0]!.open();
    unsubscribe();
    sockets[0]!.emit({ event: 'orders_updated' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('reconecta com espera crescente quando a conexão cai', () => {
    const rt = connection();
    rt.start();
    sockets[0]!.open();
    sockets[0]!.drop();

    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);

    sockets[1]!.drop(); // fails before opening -> session check, then 2s
  });

  it('pergunta pela sessão quando o handshake é recusado e para se ela acabou', async () => {
    const onHandshakeRejected = vi.fn(async () => 'stop' as const);
    const rt = connection(onHandshakeRejected);
    rt.start();
    sockets[0]!.drop(); // never opened

    await vi.runAllTimersAsync();

    expect(onHandshakeRejected).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(1);
  });

  it('volta a tentar quando a sessão continua válida, até o limite de tentativas', async () => {
    const rt = connection();
    rt.start();
    for (let i = 0; i < 6; i++) {
      sockets[sockets.length - 1]!.drop();
      await vi.runAllTimersAsync();
    }
    expect(sockets).toHaveLength(4); // first + maxRetries (3)
  });

  it('fecha o socket e não reconecta depois de parar', () => {
    const rt = connection();
    rt.start();
    sockets[0]!.open();
    rt.stop();
    vi.advanceTimersByTime(60_000);
    expect(sockets[0]!.closed).toBe(true);
    expect(sockets).toHaveLength(1);
  });

  it('ignora mensagens que não são JSON', () => {
    const rt = connection();
    const handler = vi.fn();
    rt.subscribe('orders_updated', handler);
    rt.start();
    sockets[0]!.open();
    expect(() => sockets[0]!.emit('not json')).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});
