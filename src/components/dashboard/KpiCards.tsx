import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, roleLabel } from '@/lib/formatters';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { OrdersResponse, UserStats } from '@/types';

interface KpiCardsProps {
  orders?: OrdersResponse;
  userStats?: UserStats;
  isLoading: boolean;
}

export default function KpiCards({ orders, userStats, isLoading }: KpiCardsProps) {
  const totalRevenue = orders?.revenue_trend?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalOrders = orders?.revenue_trend?.reduce((sum, d) => sum + d.orders, 0) ?? 0;
  const trend = orders?.revenue_trend ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <StatCard label="Ticket Médio" isLoading={isLoading}>
        {formatCurrency(orders?.average_order_value ?? 0)}
      </StatCard>

      <StatCard label="Receita Total (Período)" isLoading={isLoading}>
        {formatCurrency(totalRevenue)}
      </StatCard>

      <StatCard label="Total de Pedidos" isLoading={isLoading}>
        {totalOrders}
      </StatCard>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tendência de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[60px] w-full" />
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#sparkGradient)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : orders?.repeat_customers ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{orders.repeat_customers.repeat_customers}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{orders.repeat_customers.unique_customers} únicos</span>
                <Badge variant={orders.repeat_customers.repeat_rate > 30 ? 'default' : 'secondary'}>
                  {orders.repeat_customers.repeat_rate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : userStats ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{userStats.total}</div>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                {Object.entries(userStats.byRole).map(([role, count]) => (
                  <Badge key={role} variant="outline">{roleLabel(role)}: {count}</Badge>
                ))}
                <span className="ml-1">(+{userStats.recent} novos)</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, isLoading, children }: { label: string; isLoading: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
