import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateOnly } from '@/lib/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RevenueTrendItem } from '@/types';

interface RevenueChartProps {
  data?: RevenueTrendItem[];
  isLoading: boolean;
}

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const maxRevenue = Math.max(...(data ?? []).map((d) => d.revenue), 0);
  const yMax = Math.ceil(maxRevenue / 500) * 500 || 500;
  const yTicks = Array.from({ length: yMax / 500 + 1 }, (_, i) => i * 500);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Receita ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !data || data.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">Nenhum dado disponível</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[...data].sort((a, b) => a.date.localeCompare(b.date))}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                }}
                fontSize={12}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                tickFormatter={(v: number) =>
                  v === 0 ? 'R$0' : v < 1000 ? `R$${v}` : `R$${(v / 1000).toFixed(1).replace('.', ',')}k`
                }
                fontSize={12}
              />
              <Tooltip
                labelFormatter={(d: string) => formatDateOnly(d)}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
