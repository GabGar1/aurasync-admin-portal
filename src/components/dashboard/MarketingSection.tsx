import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { MarketingResponse } from '@/types';

interface MarketingSectionProps {
  data?: MarketingResponse;
  isLoading: boolean;
}

export default function MarketingSection({ data, isLoading }: MarketingSectionProps) {
  const campaignTotalRevenue = data?.by_campaign?.reduce((s, c) => s + c.revenue, 0) ?? 0;
  const campaignTotalOrders = data?.by_campaign?.reduce((s, c) => s + c.orders, 0) ?? 0;
  const overallAOV = campaignTotalOrders > 0 ? campaignTotalRevenue / campaignTotalOrders : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Marketing</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storefronts */}
        <Card>
          <CardHeader><CardTitle>Vendas por Loja</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.by_storefront?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={Math.max(200, data.by_storefront.length * 40)}>
                <BarChart data={data.by_storefront} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="storefront" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader><CardTitle>Métodos de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.by_payment_method?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.by_payment_method} dataKey="orders" nameKey="method" cx="50%" cy="50%" outerRadius={80} innerRadius={50} label={({ method }) => method || 'N/A'}>
                    {data.by_payment_method.map((entry, i) => (
                      <Cell key={i} fill={`hsl(${i * 60}, 60%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card>
          <CardHeader><CardTitle>Campanhas</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.by_campaign?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">AOV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_campaign.map((camp, i) => (
                    <TableRow key={i}>
                      <TableCell>{camp.campaign || 'N/A'}</TableCell>
                      <TableCell className="text-right">{camp.orders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(camp.revenue)}</TableCell>
                      <TableCell className={`text-right font-medium ${camp.aov > overallAOV ? 'text-green-600' : ''}`}>{formatCurrency(camp.aov)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* UTM Sources */}
        <Card>
          <CardHeader><CardTitle>Origens (UTM)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.by_source?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Mídia</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.by_source].sort((a, b) => b.revenue - a.revenue).map((src, i) => (
                    <TableRow key={i}>
                      <TableCell>{src.source || 'N/A'}</TableCell>
                      <TableCell>{src.medium || 'N/A'}</TableCell>
                      <TableCell className="text-right">{src.orders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(src.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Provinces */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Vendas por Província</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.by_province?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Província</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.by_province].sort((a, b) => b.orders - a.orders).map((prov, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{prov.province || 'N/A'}</TableCell>
                      <TableCell className="text-right">{prov.orders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(prov.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
