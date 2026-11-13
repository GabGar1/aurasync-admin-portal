import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateOnly } from '@/lib/formatters';
import { fillDailySeries } from '@/lib/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RevenueTrendItem } from '@/types';

interface RevenueChartProps {
  data?: RevenueTrendItem[];
  /** Selected period (YYYY-MM-DD), used to show days without sales as zero. */
  period: { from: string; to: string };
  isLoading: boolean;
}

const WEEKLY_AFTER_DAYS = 60;

function compactCurrency(v: number) {
  if (v === 0) return 'R$ 0';
  if (v < 1000) return `R$ ${Math.round(v)}`;
  return `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil`;
}

export default function RevenueChart({ data, period, isLoading }: RevenueChartProps) {
  const series = fillDailySeries(data ?? [], period.from, period.to, { weeklyAfterDays: WEEKLY_AFTER_DAYS });
  const weekly = countDays(period) > WEEKLY_AFTER_DAYS;
  const hasSales = (data ?? []).some((d) => d.revenue > 0);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Receita ao longo do tempo</CardTitle>
        <CardDescription>{weekly ? 'Por semana (períodos longos)' : 'Por dia'}, dias sem venda aparecem zerados</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !hasSales ? (
          <p className="py-16 text-center text-muted-foreground">Nenhuma venda no período</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={series} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDateOnly(d).slice(0, 5)}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
                minTickGap={16}
              />
              <YAxis tickFormatter={compactCurrency} fontSize={12} stroke="hsl(var(--muted-foreground))" width={72} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent))' }}
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                labelFormatter={(d: string) => (weekly ? `Semana de ${formatDateOnly(d)}` : formatDateOnly(d))}
                formatter={(value: number, name: string) =>
                  name === 'revenue' ? [formatCurrency(value), 'Receita'] : [value, 'Pedidos']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function countDays({ from, to }: { from: string; to: string }) {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;
}
