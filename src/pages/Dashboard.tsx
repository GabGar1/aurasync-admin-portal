import { useDashboard } from '@/hooks/useDashboard';
import { PageHeader } from '@/components/PageHeader';
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
  const { range, setRange, period, orders, marketing, stock } = useDashboard();

  const isLoadingOrders = orders.isLoading && !orders.data;
  const isLoadingMarketing = marketing.isLoading && !marketing.data;
  const isLoadingStock = stock.isLoading && !stock.data;
  const hasError = [orders, marketing, stock].some((q) => q.isError);

  return (
    <div className="flex flex-col space-y-6 p-4 motion-safe:animate-fade-in-up sm:p-6">
      <PageHeader
        title="Painel"
        description="Vendas, marketing e estoque do período"
        actions={<DateRangePicker range={range} onRangeChange={setRange} />}
      />

      {hasError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar o painel</AlertTitle>
          <AlertDescription>
            Alguns dados não puderam ser carregados.
            <Button
              variant="outline"
              size="sm"
              className="mt-2 ml-2"
              onClick={() => {
                if (orders.isError) orders.refetch();
                if (marketing.isError) marketing.refetch();
                if (stock.isError) stock.refetch();
              }}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <KpiCards orders={orders.data} isLoading={isLoadingOrders} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={orders.data?.revenue_trend} period={period} isLoading={isLoadingOrders} />
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
