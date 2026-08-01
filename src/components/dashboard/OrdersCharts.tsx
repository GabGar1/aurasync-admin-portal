import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { HourStats, OrderStatusStats } from '@/types';

interface OrdersChartsProps {
  byHour?: HourStats[];
  byStatus?: OrderStatusStats[];
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  paid: '#f59e0b',
  shipped: '#06b6d4',
  closed: '#22c55e',
  cancelled: '#ef4444',
};

export default function OrdersCharts({ byHour, byStatus, isLoading }: OrdersChartsProps) {
  const busiestHour = byHour?.reduce((max, h) => (h.orders > max.orders ? h : max), byHour?.[0] ?? { hour: 0, orders: 0, revenue: 0 });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : !byHour || byHour.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}h`} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {byHour.map((entry, index) => (
                    <Cell key={index} fill={entry.hour === busiestHour?.hour ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : !byStatus || byStatus.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={50} label={({ status, count }) => `${status}: ${count}`}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#888'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}
