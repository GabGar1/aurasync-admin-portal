import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { TopProductItem } from '@/types';

interface TopProductsProps {
  data?: TopProductItem[];
  isLoading: boolean;
}

export default function TopProducts({ data, isLoading }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 20 Produtos</CardTitle>
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
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Vendidos</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.variant_name || '-'}</TableCell>
                    <TableCell className="text-right">{item.total_sold}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
