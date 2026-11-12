import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { RealtimeContext, type RealtimeEvent } from '@/contexts/RealtimeContext';

const api = vi.hoisted(() => ({
  getOrders: vi.fn(async () => ({})),
  getMarketing: vi.fn(async () => ({})),
  getStock: vi.fn(async () => ({})),
  getUserStats: vi.fn(async () => ({})),
}));
vi.mock('@/services/api', () => ({ dashboardApi: api }));

import { useDashboard } from './useDashboard';

describe('useDashboard + tempo real', () => {
  const handlers = new Map<RealtimeEvent, Set<() => void>>();
  const subscribe = vi.fn((event: RealtimeEvent, handler: () => void) => {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler);
    return () => handlers.get(event)!.delete(handler);
  });
  const emit = (event: RealtimeEvent) => handlers.get(event)?.forEach((h) => h());

  beforeEach(() => {
    handlers.clear();
    vi.clearAllMocks();
  });

  function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>
      </QueryClientProvider>
    );
    return { client, ...renderHook(() => useDashboard(), { wrapper }) };
  }

  it('recarrega os indicadores num evento sem criar entradas novas no cache', async () => {
    const { client } = setup();
    await waitFor(() => expect(api.getOrders).toHaveBeenCalledTimes(1));
    const cachedBefore = client.getQueryCache().getAll().length;

    act(() => emit('orders_updated'));

    await waitFor(() => expect(api.getOrders).toHaveBeenCalledTimes(2));
    expect(api.getStock).toHaveBeenCalledTimes(2);
    expect(client.getQueryCache().getAll().length).toBe(cachedBefore);
  });

  it('assina pedidos e produtos pela conexão compartilhada', () => {
    setup();
    const events = subscribe.mock.calls.map(([event]) => event).sort();
    expect(events).toEqual(['orders_updated', 'products_updated']);
  });
});
