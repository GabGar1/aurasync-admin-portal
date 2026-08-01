import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { DateRange } from '@/components/DateRangePicker';

function toIsoStart(date: Date): string {
  return date.toISOString();
}

function toIsoEnd(date: Date): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

export function useDashboard() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [refetchKey, setRefetchKey] = useState(0);

  const triggerRefetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  const params = useCallback(() => {
    const base: { days?: number; start_date?: string; end_date?: string } = { days: 30 };
    if (range.from && range.to) {
      base.start_date = toIsoStart(range.from);
      base.end_date = toIsoEnd(range.to);
      const diffDays = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
      base.days = diffDays;
    }
    return base;
  }, [range]);

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
