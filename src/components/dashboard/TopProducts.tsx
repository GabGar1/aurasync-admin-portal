import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import type { TopProductItem } from '@/types';

interface TopProductsProps {
  data?: TopProductItem[];
  isLoading: boolean;
}

export default function TopProducts({ data, isLoading }: TopProductsProps) {
  const [view, setView] = useState<'product' | 'category'>('product');

  const byCategory = useMemo(() => {
    const map = new Map<string, { category: string; total_sold: number; revenue: number }>();
    for (const item of data ?? []) {
      const key = item.category || 'Outros';
      const agg = map.get(key) ?? { category: key, total_sold: 0, revenue: 0 };
      agg.total_sold += item.total_sold;
      agg.revenue += item.revenue;
      map.set(key, agg);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top 20 Produtos</CardTitle>
        <Tabs value={view} onValueChange={(v) => setView(v as 'product' | 'category')}>
          <TabsList>
            <TabsTrigger value="product">Por Produto</TabsTrigger>
            <TabsTrigger value="category">Por Categoria</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                {view === 'product' ? (
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Vendidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Vendidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {view === 'product' ? (
                  data.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.total_sold}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  byCategory.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">{item.total_sold}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
