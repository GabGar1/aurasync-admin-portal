import { useDashboard } from '@/hooks/useDashboard';
import DateRangePicker from '@/components/DateRangePicker';
import KpiCards from '@/components/dashboard/KpiCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrdersCharts from '@/components/dashboard/OrdersCharts';
import TopProducts from '@/components/dashboard/TopProducts';
import MarketingSection from '@/components/dashboard/MarketingSection';
import StockSection from '@/components/dashboard/StockSection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { range, setRange, orders, marketing, stock, userStats } = useDashboard();

  const isLoadingOrders = orders.isLoading && !orders.data;
  const isLoadingMarketing = marketing.isLoading && !marketing.data;
  const isLoadingStock = stock.isLoading && !stock.data;
  const isLoadingUsers = userStats.isLoading && !userStats.data;
  const hasError = [orders, marketing, stock, userStats].some((q) => q.isError);

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <DateRangePicker range={range} onRangeChange={setRange} />
      </div>

      {hasError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar o dashboard</AlertTitle>
          <AlertDescription>
            Alguns dados não puderam ser carregados.
            <Button
              variant="outline"
              size="sm"
              className="mt-2 ml-2"
              onClick={() => {
                orders.refetch();
                marketing.refetch();
                stock.refetch();
                userStats.refetch();
              }}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

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
