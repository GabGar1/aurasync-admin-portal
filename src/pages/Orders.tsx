import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ShoppingCart, MoreHorizontal, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { formatCurrency, formatDate, statusLabel, preferLabel, sourceLabel, storefrontLabel, paymentMethodLabel } from '@/lib/formatters';
import { toast } from 'sonner';
import type { Order, GetOrdersResponse } from '@/types';
import type { UseMutationResult } from '@tanstack/react-query';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import OrderTimeline from '@/components/OrderTimeline';
import OrderFinancialSummary from '@/components/OrderFinancialSummary';
import OrderShippingInfo from '@/components/OrderShippingInfo';
import OrderCustomerInfo from '@/components/OrderCustomerInfo';
import OrderItemsTable from '@/components/OrderItemsTable';

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

const statusBadgeVariant: Record<string, string> = {
  open: 'secondary',
  paid: 'default',
  shipped: 'default',
  closed: 'default',
  cancelled: 'destructive',
};

const statusBadgeClass: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent',
  paid: 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent',
  shipped: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-transparent',
  closed: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-transparent',
  cancelled: '',
};

const paymentBadgeClass: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent',
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent',
  overdue: 'bg-red-100 text-red-800 hover:bg-red-100 border-transparent',
  refunded: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-transparent',
  partially_refunded: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-transparent',
  partially_paid: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent',
  disputed: 'bg-red-100 text-red-800 hover:bg-red-100 border-transparent',
  under_review: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent',
};

const orderStatuses = ['open', 'paid', 'shipped', 'closed', 'cancelled'] as const;

export default function Orders() {
  const { getUser } = useAuth();
  const currentUser = getUser();
  const admin = isAdmin(currentUser?.role);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<GetOrdersResponse>({
    queryKey: ['orders', page, limit, statusFilter, debouncedSearch],
    queryFn: () => ordersApi.getAll({
      page, limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  useWebSocket('orders_updated', useCallback(() => {
    qc.invalidateQueries({ queryKey: ['orders'] });
    toast.success('Pedidos atualizados em tempo real!');
  }, [qc]));

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.update(id, { status }),
    onSuccess: () => {
      toast.success('Status atualizado');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: ApiError) => toast.error(
      `Falha ao atualizar: ${err?.response?.data?.error || err?.message}`
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      toast.success('Pedido cancelado');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: ApiError) => toast.error(
      `Falha ao cancelar: ${err?.response?.data?.error || err?.message}`
    ),
  });

  const syncMutation = useMutation({
    mutationFn: ordersApi.syncNuvemshop,
    onSuccess: () => {
      toast.success('Sincronização de pedidos iniciada em segundo plano. A lista será atualizada automaticamente.');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: ApiError) => toast.error(
      `Falha ao sincronizar: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`
    ),
  });

  function handleRowClick(order: Order) {
    setSelectedOrder(order);
    setDetailSheetOpen(true);
  }

  function handleCancelClick(orderId: string) {
    setCancellingId(orderId);
    setCancelDialogOpen(true);
  }

  function confirmCancel() {
    if (cancellingId) {
      deleteMutation.mutate(cancellingId);
    }
    setCancelDialogOpen(false);
    setCancellingId(null);
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const orders = data?.orders || [];

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Gerenciamento de pedidos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por cliente ou ID..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => { setStatusFilter(value); setPage(1); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="open">Ativo</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="closed">Arquivado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between shrink-0">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} resultado${data.total !== 1 ? 's' : ''}` : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar pedidos</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : orders.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm mb-4">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="[&>div]:overflow-visible">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-[10%]">ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[16%]">Data</TableHead>
                  <TableHead className="w-[18%]">Status</TableHead>
                  <TableHead className="w-[18%] text-right">Total</TableHead>
                  <TableHead className="w-[9%] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 mx-auto rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
<TableCell className="font-medium">
  <span className="truncate block max-w-full">{order.customer_name}</span>
</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[order.status] || ''} variant={order.status === 'cancelled' ? 'destructive' : 'default'}>
                          {statusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {admin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={order.status === 'paid'}
                                onClick={() => updateMutation.mutate({ id: order.id, status: 'paid' })}
                              >
                                Marcar como Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={order.status === 'shipped'}
                                onClick={() => updateMutation.mutate({ id: order.id, status: 'shipped' })}
                              >
                                Marcar como Enviado
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                disabled={order.status === 'cancelled'}
                                onClick={() => handleCancelClick(order.id)}
                              >
                                Cancelar Pedido
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {data && (
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {data.page} de {Math.ceil(data.total / data.limit)}
            </span>
            <Select
              value={String(limit)}
              onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / data.limit)}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="right" className="w-[640px] sm:max-w-[640px] overflow-y-auto">
          {selectedOrder ? (
            <>
              <SheetHeader>
                <SheetTitle>Pedido #{selectedOrder.id.slice(0, 8)}</SheetTitle>
                <SheetDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={statusBadgeClass[selectedOrder.status] || ''} variant={selectedOrder.status === 'cancelled' || selectedOrder.status === 'CANCELED' ? 'destructive' : 'default'}>
                      {preferLabel(selectedOrder.status_label, statusLabel(selectedOrder.status))}
                    </Badge>
                    {selectedOrder.commercial_status ? (
                      <Badge variant="secondary">{selectedOrder.commercial_status}</Badge>
                    ) : null}
                    {selectedOrder.payment_status_label ? (
                      <Badge className={paymentBadgeClass[selectedOrder.payment_status ?? ''] || ''}>{selectedOrder.payment_status_label}</Badge>
                    ) : null}
                    {selectedOrder.fulfillment_status_label ? (
                      <Badge variant="outline">{selectedOrder.fulfillment_status_label}</Badge>
                    ) : null}
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-8">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cliente</h3>
                  <OrderCustomerInfo customer_name={selectedOrder.customer_name} customer_email={selectedOrder.customer_email} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Origem</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Fonte: </span>{sourceLabel(selectedOrder.source)}</p>
                    {selectedOrder.storefront ? (
                      <p><span className="text-muted-foreground">Storefront: </span>{storefrontLabel(selectedOrder.storefront)}</p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Itens</h3>
                  <OrderItemsTable items={selectedOrder.items} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pagamento</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      {selectedOrder.payment_method ? paymentMethodLabel(selectedOrder.payment_method) : '-'}
                      {selectedOrder.payment_installments ? ` (${selectedOrder.payment_installments}x)` : ''}
                    </p>
                    {selectedOrder.gateway ? (
                      <p className="text-muted-foreground">Gateway: {selectedOrder.gateway}</p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Frete</h3>
                  <OrderShippingInfo
                    shipping_cost_customer={selectedOrder.shipping_cost_customer}
                    shipping_cost_owner={selectedOrder.shipping_cost_owner}
                    shipping_carrier={selectedOrder.shipping_carrier}
                    has_free_shipping={selectedOrder.has_free_shipping}
                    shipping_city={selectedOrder.shipping_city}
                    shipping_province={selectedOrder.shipping_province}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Endereço</h3>
                  <p className="text-sm">
                    {[selectedOrder.shipping_city, selectedOrder.shipping_province].filter(Boolean).join(' - ') || '-'}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">UTMs</h3>
                  {selectedOrder.utm_source || selectedOrder.utm_medium || selectedOrder.utm_campaign ? (
                    <div className="space-y-1 text-sm">
                      {selectedOrder.utm_source ? <p>Source: {selectedOrder.utm_source}</p> : null}
                      {selectedOrder.utm_medium ? <p>Medium: {selectedOrder.utm_medium}</p> : null}
                      {selectedOrder.utm_campaign ? <p>Campanha: {selectedOrder.utm_campaign}</p> : null}
                      {selectedOrder.utm_content ? <p>Conteúdo: {selectedOrder.utm_content}</p> : null}
                      {selectedOrder.utm_term ? <p>Termo: {selectedOrder.utm_term}</p> : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma UTM registrada</p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financeiro</h3>
                  <OrderFinancialSummary order={selectedOrder} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Linha do Tempo</h3>
                  <OrderTimeline
                    created_at={selectedOrder.created_at}
                    paid_at={selectedOrder.paid_at}
                    shipped_at={selectedOrder.shipped_at}
                    completed_at={selectedOrder.completed_at}
                    cancelled_at={selectedOrder.cancelled_at}
                  />
                </section>

                {admin ? (
                  <div className="flex gap-2 pt-4 border-t">
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => {
                        updateMutation.mutate({ id: selectedOrder.id, status: value });
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((s) => (
                          <SelectItem key={s} value={s} disabled={s === selectedOrder.status}>
                            {statusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      disabled={selectedOrder.status === 'cancelled' || selectedOrder.status === 'CANCELED'}
                      onClick={() => handleCancelClick(selectedOrder.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o pedido {cancellingId?.slice(0, 8)}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

