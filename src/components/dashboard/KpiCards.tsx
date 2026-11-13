import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, marginPercent } from '@/lib/formatters';
import { periodDelta } from '@/lib/dashboard';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { OrdersResponse } from '@/types';

interface KpiCardsProps {
  orders?: OrdersResponse;
  isLoading: boolean;
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const { percent, direction } = periodDelta(current, previous);
  if (percent === null) {
    return <span className="text-xs text-muted-foreground">sem base no período anterior</span>;
  }
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        direction === 'up' && 'text-success',
        direction === 'down' && 'text-destructive',
        direction === 'flat' && 'text-muted-foreground',
      )}
      title="Comparado com o período anterior de mesmo tamanho"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {percent > 0 ? '+' : ''}{percent.toString().replace('.', ',')}%
      <span className="ml-1 font-normal text-muted-foreground">vs. período anterior</span>
    </span>
  );
}

function StatCard({ label, value, footer, isLoading, children }: {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  isLoading: boolean;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
            {footer}
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** The four business numbers of the period, each compared with the period right before it. */
export default function KpiCards({ orders, isLoading }: KpiCardsProps) {
  const current = orders?.summary;
  const previous = orders?.previous_summary;
  const trend = orders?.revenue_trend ?? [];
  const repeat = orders?.repeat_customers;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Receita"
        isLoading={isLoading}
        value={formatCurrency(current?.revenue ?? 0)}
        footer={current && previous ? <Delta current={current.revenue} previous={previous.revenue} /> : null}
      >
        {trend.length > 1 ? (
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={[...trend].sort((a, b) => a.date.localeCompare(b.date))}>
              <defs>
                <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="linear" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#sparkGradient)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </StatCard>

      <StatCard
        label="Pedidos"
        isLoading={isLoading}
        value={current?.orders ?? 0}
        footer={current && previous ? <Delta current={current.orders} previous={previous.orders} /> : null}
      >
        {repeat && repeat.unique_customers > 0 ? (
          <p className="text-xs text-muted-foreground">
            {repeat.repeat_customers} de {repeat.unique_customers} clientes compraram mais de uma vez
            {' '}({marginPercent(repeat.repeat_rate * 100)})
          </p>
        ) : null}
      </StatCard>

      <StatCard
        label="Ticket médio"
        isLoading={isLoading}
        value={formatCurrency(current?.average_order_value ?? 0)}
        footer={current && previous ? <Delta current={current.average_order_value} previous={previous.average_order_value} /> : null}
      />

      <StatCard
        label="Lucro"
        isLoading={isLoading}
        value={formatCurrency(current?.profit ?? 0)}
        footer={current && previous ? <Delta current={current.profit} previous={previous.profit} /> : null}
      >
        <p className="text-xs text-muted-foreground">
          Margem de {marginPercent(current?.margin_percent ?? 0)} sobre a receita líquida, antes dos custos mensais
        </p>
      </StatCard>
    </div>
  );
}
