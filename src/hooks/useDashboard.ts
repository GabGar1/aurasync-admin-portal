import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export function useDashboard() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [refetchKey, setRefetchKey] = useState(0);

  const triggerRefetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  const params = useCallback(() => buildDashboardParams(range), [range]);

  const orders = useQuery({
    queryKey: ['dashboard-orders', range, refetchKey],
    queryFn: () => dashboardApi.getOrders(params()),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const marketing = useQuery({
    queryKey: ['dashboard-marketing', range, refetchKey],
    queryFn: () => dashboardApi.getMarketing(params()),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const stock = useQuery({
    queryKey: ['dashboard-stock', refetchKey],
    queryFn: () => dashboardApi.getStock(30),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const userStats = useQuery({
    queryKey: ['dashboard-user-stats', refetchKey],
    queryFn: () => dashboardApi.getUserStats(),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  useWebSocket('products_updated', triggerRefetch);
  useWebSocket('orders_updated', triggerRefetch);

  return { range, setRange, orders, marketing, stock, userStats };
}
