import { useDashboard } from '@/hooks/useDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KpiCards from '@/components/dashboard/KpiCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrdersCharts from '@/components/dashboard/OrdersCharts';
import TopProducts from '@/components/dashboard/TopProducts';
import MarketingSection from '@/components/dashboard/MarketingSection';
import StockSection from '@/components/dashboard/StockSection';

export default function Dashboard() {
  const { days, setDays, orders, marketing, stock, userStats } = useDashboard();

  const isLoadingOrders = orders.isLoading && !orders.data;
  const isLoadingMarketing = marketing.isLoading && !marketing.data;
  const isLoadingStock = stock.isLoading && !stock.data;
  const isLoadingUsers = userStats.isLoading && !userStats.data;

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[7, 15, 30, 60, 90].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} dias</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <KpiCards orders={orders.data} userStats={userStats.data} isLoading={isLoadingOrders || isLoadingUsers} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={orders.data?.revenue_trend} isLoading={isLoadingOrders} />
        <OrdersCharts
          byHour={orders.data?.by_hour}
          byStatus={orders.data?.by_status}
          isLoading={isLoadingOrders}
        />
      </div>

      <TopProducts data={orders.data?.top_products} isLoading={isLoadingOrders} />

      <MarketingSection data={marketing.data} isLoading={isLoadingMarketing} />

      <StockSection data={stock.data} isLoading={isLoadingStock} />
    </div>
  );
}
