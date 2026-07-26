import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Plus, ShoppingCart, MoreHorizontal, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { formatCurrency, formatDate, statusLabel } from '@/lib/formatters';
import { toast } from 'sonner';
import type { Order, CreateOrderPayload, GetOrdersResponse } from '@/types';
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
import { Label } from '@/components/ui/label';
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
  PENDING: 'secondary',
  PAID: 'default',
  SHIPPED: 'default',
  CANCELED: 'destructive',
};

const statusBadgeClass: Record<string, string> = {
  PENDING: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent',
  PAID: 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent',
  SHIPPED: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-transparent',
  CANCELED: '',
};

const orderStatuses = ['PENDING', 'PAID', 'SHIPPED', 'CANCELED'] as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.create(payload),
    onSuccess: () => {
      toast.success('Pedido criado com sucesso');
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCreateSheetOpen(false);
    },
    onError: (err: ApiError) => toast.error(
      `Falha ao criar pedido: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`
    ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.update(id, { status: status as CreateOrderPayload['status'] }),
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
    onSuccess: (res) => {
      toast.success(`Sincronização concluída! ${res.processed || 0} pedidos atualizados.`);
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
    <div className="flex flex-col p-6 space-y-6">
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
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="SHIPPED">Enviado</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
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
          {admin ? (
            <Button size="sm" onClick={() => setCreateSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Pedido
            </Button>
          ) : null}
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
            <p className="text-sm mb-4">Tente ajustar os filtros ou crie um novo pedido.</p>
            {admin ? (
              <Button onClick={() => setCreateSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Novo Pedido
              </Button>
            ) : null}
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
                        <Badge className={statusBadgeClass[order.status] || ''} variant={order.status === 'CANCELED' ? 'destructive' : 'default'}>
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
                                disabled={order.status === 'PAID'}
                                onClick={() => updateMutation.mutate({ id: order.id, status: 'PAID' })}
                              >
                                Marcar como Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={order.status === 'SHIPPED'}
                                onClick={() => updateMutation.mutate({ id: order.id, status: 'SHIPPED' })}
                              >
                                Marcar como Enviado
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                disabled={order.status === 'CANCELED'}
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
                  <Badge className={statusBadgeClass[selectedOrder.status] || ''} variant={selectedOrder.status === 'CANCELED' ? 'destructive' : 'default'}>
                    {statusLabel(selectedOrder.status)}
                  </Badge>
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-8">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cliente</h3>
                  <OrderCustomerInfo customer_name={selectedOrder.customer_name} />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Linha do Tempo</h3>
                  <OrderTimeline />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financeiro</h3>
                  <OrderFinancialSummary
                    items={selectedOrder.items}
                    total_amount={selectedOrder.total_amount}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Frete</h3>
                  <OrderShippingInfo />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Itens</h3>
                  <OrderItemsTable items={selectedOrder.items} />
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
                      disabled={selectedOrder.status === 'CANCELED'}
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

      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent side="right" className="w-[640px] sm:max-w-[640px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Pedido</SheetTitle>
            <SheetDescription>Preencha os dados do pedido</SheetDescription>
          </SheetHeader>

          <CreateOrderForm
            onSubmit={(payload) => createMutation.mutate(payload)}
            isPending={createMutation.isPending}
          />
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

function CreateOrderForm({ onSubmit, isPending }: { onSubmit: (payload: CreateOrderPayload) => void; isPending: boolean }) {
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<string>('PENDING');
  const [items, setItems] = useState<Array<{ variant_id: string; quantity: string; unit_price: string; unit_cost: string }>>([]);

  function addItem() {
    setItems([...items, { variant_id: '', quantity: '1', unit_price: '', unit_cost: '' }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: string) {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) return;
    onSubmit({
      customer_name: customerName.trim(),
      status: status as CreateOrderPayload['status'],
      items: items.map((item) => ({
        variant_id: item.variant_id,
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        unit_cost: parseFloat(item.unit_cost) || 0,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="py-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer_name">Cliente</Label>
        <Input
          id="customer_name"
          placeholder="Nome do cliente"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderStatuses.map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Itens</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" />
            Adicionar Item
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhum item adicionado</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start border rounded-md p-3">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Variant ID"
                    value={item.variant_id}
                    onChange={(e) => updateItem(i, 'variant_id', e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Qtd"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      required
                      className="w-20"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Preço"
                      value={item.unit_price}
                      onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Custo"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(i, 'unit_cost', e.target.value)}
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 mt-0 shrink-0" onClick={() => removeItem(i)}>
                  <span className="text-destructive font-bold">X</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending || !customerName.trim()}>
          {isPending ? 'Criando...' : 'Criar Pedido'}
        </Button>
      </div>
    </form>
  );
}
