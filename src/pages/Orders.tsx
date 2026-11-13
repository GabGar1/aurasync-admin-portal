import { useState, useCallback } from 'react';
import { Search, RefreshCw, ShoppingCart, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, getFriendlyError } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { isEditableLocally } from '@/lib/orders';
import { orderStatusBadge } from '@/lib/status';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import type { Order, GetOrdersResponse } from '@/types';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTablePagination from '@/components/DataTablePagination';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderDetailSheet, orderDisplayId } from '@/components/orders/OrderDetailSheet';

const fulfillmentFilterOptions: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'unpacked', label: 'Empacotando' },
  { value: 'dispatched', label: 'Despachado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'marked_as_fulfilled', label: 'Marcado como concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

const COST_INCOMPLETE_HINT = 'Há itens sem cadastro no AuraSync: o custo e o lucro deste pedido estão incompletos';

function OrderBadges({ order }: { order: Order }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <StatusBadge {...orderStatusBadge(order)} />
      {order.cost_incomplete ? <StatusBadge tone="warning" label="Custo incompleto" title={COST_INCOMPLETE_HINT} /> : null}
    </div>
  );
}

interface RowActionsProps {
  order: Order;
  onUpdate: (status: string) => void;
  onCancel: () => void;
}

function OrderRowActions({ order, onUpdate, onCancel }: RowActionsProps) {
  const effective = orderStatusBadge(order);
  const label = effective.label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações do pedido ${orderDisplayId(order)}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={label === 'Pago' || label === 'Entregue'} onClick={() => onUpdate('PAID')}>
          Marcar como pago
        </DropdownMenuItem>
        <DropdownMenuItem disabled={label === 'Enviado' || label === 'Entregue'} onClick={() => onUpdate('SHIPPED')}>
          Marcar como enviado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={effective.tone === 'danger'} onClick={onCancel}>
          Cancelar pedido
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Orders() {
  const { getUser } = useAuth();
  const currentUser = getUser();
  const admin = isAdmin(currentUser?.role);
  const qc = useQueryClient();

  const { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter } = useTableFilters<{ fulfillment_status: string }>();
  const fulfillmentFilter = filter?.fulfillment_status ?? 'all';

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  // Keep the id, not a copy: the sheet must show the order as refreshed after a change.
  const [selectedSnapshot, setSelectedSnapshot] = useState<Order | null>(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<GetOrdersResponse>({
    queryKey: ['orders', page, limit, fulfillmentFilter, debouncedSearch],
    queryFn: () => ordersApi.getAll({
      page, limit,
      fulfillment_status: fulfillmentFilter !== 'all' ? fulfillmentFilter : undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  useWebSocket('orders_updated', useCallback(() => {
    qc.invalidateQueries({ queryKey: ['orders'] });
    toast.success('Pedidos atualizados em tempo real!');
  }, [qc]));

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.update(id, { status }),
    onSuccess: () => {
      toast.success('Situação atualizada');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(`Falha ao atualizar: ${getFriendlyError(err)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      toast.success('Pedido cancelado');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(`Falha ao cancelar: ${getFriendlyError(err)}`),
  });

  const syncMutation = useMutation({
    mutationFn: ordersApi.syncNuvemshop,
    onSuccess: () => {
      toast.success('Sincronização de pedidos iniciada em segundo plano. A lista será atualizada automaticamente.');
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(`Falha ao sincronizar: ${getFriendlyError(err)}`),
  });

  function openOrder(order: Order) {
    setSelectedSnapshot(order);
    setDetailSheetOpen(true);
  }

  function handleCancelClick(orderId: string) {
    setCancellingId(orderId);
    setCancelDialogOpen(true);
  }

  function confirmCancel() {
    if (cancellingId) deleteMutation.mutate(cancellingId);
    setCancelDialogOpen(false);
    setCancellingId(null);
  }

  const orders = data?.orders || [];
  const selectedOrder = selectedSnapshot ? orders.find((o) => o.id === selectedSnapshot.id) ?? selectedSnapshot : null;
  const canAct = (order: Order) => admin && isEditableLocally(order);

  return (
    <div className="flex flex-col space-y-6 p-4 motion-safe:animate-fade-in-up sm:p-6">
      <PageHeader
        title="Pedidos"
        description="Pedidos da Nuvemshop e vendas registradas no AuraSync"
        actions={
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`mr-1 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar com a Nuvemshop
          </Button>
        }
      />

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por cliente ou ID..."
            aria-label="Pesquisar pedidos"
            className="pl-9"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
        <Select
          value={fulfillmentFilter}
          onValueChange={(value) => changeFilter(value === 'all' ? undefined : { fulfillment_status: value })}
        >
          <SelectTrigger className="sm:w-[200px]" aria-label="Filtrar por situação de envio">
            <SelectValue placeholder="Filtrar por situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            {fulfillmentFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {data ? `${data.total} resultado${data.total !== 1 ? 's' : ''}` : ''}
      </p>

      {isError ? (
        <div className="flex items-center justify-center py-16">
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar pedidos</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : orders.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ShoppingCart className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">Nenhum pedido encontrado</p>
          <p className="mb-4 text-sm">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <>
          {/* Phones: one card per order */}
          <ul className="space-y-2 md:hidden" aria-label="Pedidos">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <li key={i}><Skeleton className="h-20 w-full rounded-lg" /></li>)
              : orders.map((order) => (
                <li key={order.id} className="flex items-start gap-2 rounded-lg border bg-card p-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openOrder(order)}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium">{order.customer_name || 'Cliente não informado'}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(order.total_amount)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">#{orderDisplayId(order)}</span> · {formatDate(order.created_at)}
                    </div>
                    <div className="mt-2"><OrderBadges order={order} /></div>
                  </button>
                  {canAct(order) ? (
                    <OrderRowActions
                      order={order}
                      onUpdate={(status) => updateMutation.mutate({ id: order.id, status })}
                      onCancel={() => handleCancelClick(order.id)}
                    />
                  ) : null}
                </li>
              ))}
          </ul>

          {/* Tablets and up: table */}
          <div className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-[12%]">Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[14%]">Data</TableHead>
                  <TableHead className="w-[24%]">Situação</TableHead>
                  <TableHead className="w-[15%] text-right">Total</TableHead>
                  <TableHead className="w-[8%] text-center"><span className="sr-only">Ações</span></TableHead>
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
                      <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="mx-auto h-8 w-8 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => openOrder(order)}>
                      <TableCell className="py-2.5 font-mono text-xs">#{orderDisplayId(order)}</TableCell>
                      <TableCell className="py-2.5 font-medium"><div className="truncate">{order.customer_name}</div></TableCell>
                      <TableCell className="py-2.5 tabular-nums">{formatDate(order.created_at)}</TableCell>
                      <TableCell className="py-2.5"><OrderBadges order={order} /></TableCell>
                      <TableCell className="py-2.5 text-right font-medium tabular-nums">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {canAct(order) ? (
                          <OrderRowActions
                            order={order}
                            onUpdate={(status) => updateMutation.mutate({ id: order.id, status })}
                            onCancel={() => handleCancelClick(order.id)}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {data && (
        <DataTablePagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} onLimitChange={changeLimit} />
      )}

      <OrderDetailSheet
        order={selectedOrder}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        canManage={admin}
        updating={updateMutation.isPending}
        onChangeStatus={(status) => selectedOrder && updateMutation.mutate({ id: selectedOrder.id, status })}
        onCancel={() => selectedOrder && handleCancelClick(selectedOrder.id)}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              O pedido {cancellingId?.slice(0, 8)} continua na lista como cancelado e os itens voltam para o estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
