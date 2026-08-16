import { useQuery } from '@tanstack/react-query';
import { CreditCard, Globe, Repeat, AlertTriangle } from 'lucide-react';
import { customersApi } from '@/services/api';
import { formatCurrency, formatDate, paymentMethodLabel, statusLabel } from '@/lib/formatters';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Customer } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export default function CustomerDetailDrawer({ open, onOpenChange, customer }: Props) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer', customer?.id],
    queryFn: () => customersApi.getById(customer!.id),
    enabled: open && !!customer,
  });

  const { data: orders, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ['customer-orders', customer?.id],
    queryFn: () => customersApi.getOrders(customer!.id),
    enabled: open && !!customer,
  });

  const indicators = data?.indicators;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] overflow-y-auto">
        {customer ? (
          <>
            <SheetHeader>
              <SheetTitle>{customer.name}</SheetTitle>
              <SheetDescription>
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                ) : 'Sem email cadastrado'}
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumo</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                  </div>
                ) : isError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar cliente</AlertTitle>
                    <AlertDescription>
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
                    </AlertDescription>
                  </Alert>
                ) : indicators ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <SummaryRow label="Pedidos" value={String(indicators.order_count)} />
                    <SummaryRow label="Total gasto" value={formatCurrency(indicators.total_spent)} />
                    <SummaryRow label="Ticket médio" value={formatCurrency(indicators.average_ticket)} />
                    <SummaryRow label="Primeira compra" value={formatDate(indicators.first_purchase_at)} />
                    <SummaryRow label="Última compra" value={formatDate(indicators.last_purchase_at ?? indicators.first_purchase_at)} />
                    {customer.city || customer.province ? (
                      <SummaryRow label="Cidade / UF" value={[customer.city, customer.province].filter(Boolean).join(' - ')} />
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Indicadores</h3>
                {indicators ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Pagamento favorito:</span>
                      <span className="font-medium">{paymentMethodLabel(indicators.favorite_payment_method)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Gateway preferido:</span>
                      <span className="font-medium">{indicators.favorite_gateway ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cliente recorrente:</span>
                      <span className="font-medium">{indicators.recurrence > 0 ? 'Sim' : 'Não'}</span>
                    </div>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Histórico de Pedidos</h3>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : ordersError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar pedidos</AlertTitle>
                    <AlertDescription>
                      <Button variant="outline" size="sm" onClick={() => refetchOrders()} className="mt-2">Tentar novamente</Button>
                    </AlertDescription>
                  </Alert>
                ) : !orders || orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum pedido encontrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell><Badge variant="secondary">{statusLabel(order.status)}</Badge></TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-md border p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
