import { useDashboard } from '@/hooks/useDashboard';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCards from '@/components/dashboard/KpiCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrdersCharts from '@/components/dashboard/OrdersCharts';
import TopProducts from '@/components/dashboard/TopProducts';
import MarketingSection from '@/components/dashboard/MarketingSection';
import StockSection from '@/components/dashboard/StockSection';

export default function Dashboard() {
  const { range, setRange, orders, marketing, stock, userStats } = useDashboard();

  const isLoadingOrders = orders.isLoading && !orders.data;
  const isLoadingMarketing = marketing.isLoading && !marketing.data;
  const isLoadingStock = stock.isLoading && !stock.data;
  const isLoadingUsers = userStats.isLoading && !userStats.data;

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <DateRangePicker range={range} onRangeChange={setRange} />
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
