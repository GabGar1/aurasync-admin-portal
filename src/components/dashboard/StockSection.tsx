import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockResponse } from '@/types';

interface StockSectionProps {
  data?: StockResponse;
  isLoading: boolean;
}

export default function StockSection({ data, isLoading }: StockSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Estoque</h2>
      <p className="text-xs text-muted-foreground">Estoque: últimos 30 dias (período fixo)</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <Card>
          <CardHeader><CardTitle>Estoque Baixo</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.low_stock?.length ? (
              <div className="flex items-center justify-center py-8">
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Todos os estoques saudáveis</Badge>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.low_stock.slice(0, 15).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.variant_name || '-'}</TableCell>
                        <TableCell>{item.sku || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.stock <= 5 ? 'destructive' : 'secondary'}>{item.stock}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.low_stock.length > 15 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                          +{data.low_stock.length - 15} itens não exibidos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* No Sales 30d */}
        <Card>
          <CardHeader><CardTitle>Sem Vendas (30 dias)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.no_sales_30d?.length ? <p className="text-muted-foreground text-center py-8">Nenhum</p> : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.no_sales_30d.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.variant_name || '-'}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Turnover Rates */}
        <Card>
          <CardHeader><CardTitle>Taxa de Giro</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.turnover_rate?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead className="text-right">Vendas (30d)</TableHead>
                      <TableHead className="text-right">Estoque Médio</TableHead>
                      <TableHead className="text-right">Giro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...data.turnover_rate].sort((a, b) => b.turnover - a.turnover).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.variant_name || '-'}</TableCell>
                        <TableCell className="text-right">{item.sales_qty_30d}</TableCell>
                        <TableCell className="text-right">{item.avg_stock.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.turnover > 3 ? 'default' : 'secondary'} className={item.turnover < 1 ? 'bg-amber-100 text-amber-800' : ''}>
                            {item.turnover.toFixed(2)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dead Stock */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Estoque Parado (90+ dias sem venda)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px]" /> : !data?.dead_stock?.length ? <p className="text-muted-foreground text-center py-8">Nenhum</p> : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Dias sem venda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dead_stock.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.variant_name || '-'}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.days_without_sale > 90 ? 'destructive' : 'secondary'}>{item.days_without_sale}d</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
