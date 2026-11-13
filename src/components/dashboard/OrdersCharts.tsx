import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { statusLabel } from '@/lib/formatters';
import { fulfillmentTone, toneColor } from '@/lib/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { HourStats, OrderStatusStats } from '@/types';

interface OrdersChartsProps {
  byHour?: HourStats[];
  byStatus?: OrderStatusStats[];
  isLoading: boolean;
}

const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 };

export default function OrdersCharts({ byHour, byStatus, isLoading }: OrdersChartsProps) {
  const busiestHour = byHour?.reduce((max, h) => (h.orders > max.orders ? h : max), byHour?.[0] ?? { hour: 0, orders: 0, revenue: 0 });
  const totalStatus = byStatus?.reduce((s, e) => s + e.count, 0) ?? 0;
  const label = (s: OrderStatusStats) => s.status_label ?? statusLabel(s.status);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por hora</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : !byHour || byHour.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={byHour}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}h`} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Pedidos']} labelFormatter={(hour) => `${hour}h`} />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                    {byHour.map((entry) => (
                      <Cell key={entry.hour} fill={entry.hour === busiestHour?.hour ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.35)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {busiestHour ? (
                <p className="mt-2 text-xs text-muted-foreground">Horário de pico: {busiestHour.hour}h ({busiestHour.orders} pedidos)</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por situação de envio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : !byStatus || byStatus.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Sem dados</p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={200} className="sm:!w-[45%]">
                <PieChart>
                  <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={52} paddingAngle={1}>
                    {byStatus.map((entry) => (
                      <Cell key={entry.status} fill={toneColor[fulfillmentTone(entry.status)]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, statusLabel(name)]} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="w-full flex-1 space-y-2" aria-label="Legenda">
                {byStatus.map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: toneColor[fulfillmentTone(entry.status)] }} />
                      {label(entry)}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {entry.count} ({totalStatus > 0 ? ((entry.count / totalStatus) * 100).toFixed(1).replace('.', ',') : 0}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
