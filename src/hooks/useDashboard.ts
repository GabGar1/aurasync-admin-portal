import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { dashboardApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { DateRange } from '@/components/DateRangePicker';

function toLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function buildDashboardParams(range: DateRange): { days?: number; start_date?: string; end_date?: string } {
  if (range.from && range.to) {
    return { start_date: toLocalDate(range.from), end_date: toLocalDate(range.to) };
  }
  return { days: 30 };
}

/** Every dashboard query lives under this prefix, so one invalidation refreshes them all. */
const DASHBOARD_KEY = 'dashboard';
// Realtime events are the main refresh trigger; polling only covers what has no event (e.g. users).
const POLL_INTERVAL_MS = 5 * 60_000;

export function useDashboard() {
  const qc = useQueryClient();
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const params = buildDashboardParams(range);

  const orders = useQuery({
    queryKey: [DASHBOARD_KEY, 'orders', params],
    queryFn: () => dashboardApi.getOrders(params),
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (prev) => prev,
  });

  const marketing = useQuery({
    queryKey: [DASHBOARD_KEY, 'marketing', params],
    queryFn: () => dashboardApi.getMarketing(params),
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (prev) => prev,
  });

  const stock = useQuery({
    queryKey: [DASHBOARD_KEY, 'stock'],
    queryFn: () => dashboardApi.getStock(30),
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (prev) => prev,
  });

  const userStats = useQuery({
    queryKey: [DASHBOARD_KEY, 'user-stats'],
    queryFn: () => dashboardApi.getUserStats(),
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (prev) => prev,
  });

  // Refetches the existing queries in place instead of creating new cache entries.
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
  }, [qc]);

  useWebSocket('products_updated', refresh);
  useWebSocket('orders_updated', refresh);

  return { range, setRange, orders, marketing, stock, userStats };
}
