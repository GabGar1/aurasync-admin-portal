import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';

export function useDashboard() {
  const [days, setDays] = useState(30);
  const [refetchKey, setRefetchKey] = useState(0);

  const triggerRefetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  const orders = useQuery({
    queryKey: ['dashboard-orders', days, refetchKey],
    queryFn: () => dashboardApi.getOrders(days),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const marketing = useQuery({
    queryKey: ['dashboard-marketing', days, refetchKey],
    queryFn: () => dashboardApi.getMarketing(days),
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const stock = useQuery({
    queryKey: ['dashboard-stock', days, refetchKey],
    queryFn: () => dashboardApi.getStock(days),
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

  return { days, setDays, orders, marketing, stock, userStats };
}
