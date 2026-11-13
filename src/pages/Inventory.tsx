import { useState } from 'react';
import { Plus, AlertTriangle, Database, Loader2, Search, ArrowDownLeft, ArrowUpRight, ListOrdered } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, getFriendlyError } from '@/services/api';
import type { CreateInventoryPayload, GetInventoryResponse, InventoryTransaction } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTableFilters } from '@/hooks/useTableFilters';
import { can } from '@/lib/permissions';
import { formatDateTime } from '@/lib/formatters';
import { inventoryTypeBadge } from '@/lib/status';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import DataTablePagination from '@/components/DataTablePagination';
import VariantPicker, { type PickedVariant } from '@/components/VariantPicker';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const typeOptions = [
  { value: 'SALE', label: 'Vendas' },
  { value: 'RESTOCK', label: 'Entradas e devoluções' },
  { value: 'ADJUSTMENT', label: 'Ajustes manuais' },
] as const;

function SummaryCard({ icon: Icon, label, value, tone }: { icon: typeof ListOrdered; label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted ${tone ?? ''}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function productLabel(t: InventoryTransaction) {
  const variant = t.variant_name && t.variant_name !== 'Padrão' ? ` · ${t.variant_name}` : '';
  return `${t.product_name ?? 'Produto removido'}${variant}`;
}

export default function Inventory() {
  const { user } = useAuth();
  const admin = can(user?.role, 'inventory.adjust');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter } =
    useTableFilters<{ type: string }>({ defaultLimit: 20 });
  const typeFilter = filter?.type ?? 'all';

  const { data, isLoading, isError, refetch } = useQuery<GetInventoryResponse>({
    queryKey: ['inventory', page, limit, typeFilter, debouncedSearch],
    queryFn: () => inventoryApi.getAll({
      page,
      limit,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateInventoryPayload) => inventoryApi.create(payload),
    onSuccess: () => {
      toast.success('Ajuste de estoque registrado');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
    },
    onError: (err) => toast.error(`Falha ao registrar: ${getFriendlyError(err)}`),
  });

  const transactions = data?.transactions || [];
  const hasFilters = typeFilter !== 'all' || !!debouncedSearch;

  return (
    <div className="flex flex-col space-y-6 p-4 motion-safe:animate-fade-in-up sm:p-6">
      <PageHeader
        title="Inventário"
        description="Cada entrada e saída de estoque: vendas, cancelamentos e ajustes manuais"
        actions={admin ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Ajustar estoque
          </Button>
        ) : null}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={ArrowDownLeft} label="Unidades que entraram" value={isLoading ? '…' : `+${data?.summary?.entries ?? 0}`} tone="text-success" />
        <SummaryCard icon={ArrowUpRight} label="Unidades que saíram" value={isLoading ? '…' : `−${data?.summary?.exits ?? 0}`} tone="text-destructive" />
        <SummaryCard icon={ListOrdered} label="Movimentações" value={isLoading ? '…' : String(data?.summary?.movements ?? 0)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por produto ou SKU..."
            aria-label="Pesquisar movimentações"
            className="pl-9"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => changeFilter(value === 'all' ? undefined : { type: value })}>
          <SelectTrigger className="sm:w-[220px]" aria-label="Filtrar por tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex items-center justify-center py-16">
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar movimentações</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : transactions.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Database className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">Nenhuma movimentação encontrada</p>
          <p className="text-sm">
            {hasFilters ? 'Tente ajustar os filtros.' : 'As movimentações aparecem aqui quando há vendas, cancelamentos ou ajustes.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden" aria-label="Movimentações">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <li key={i}><Skeleton className="h-16 w-full rounded-lg" /></li>)
              : transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{productLabel(t)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(t.created_at)}{t.sku ? ` · ${t.sku}` : ''}</p>
                    <div className="mt-1.5"><StatusBadge {...inventoryTypeBadge(t.type)} /></div>
                  </div>
                  <span className={`text-lg font-semibold tabular-nums ${t.quantity_changed < 0 ? 'text-destructive' : 'text-success'}`}>
                    {t.quantity_changed > 0 ? `+${t.quantity_changed}` : t.quantity_changed}
                  </span>
                </li>
              ))}
          </ul>

          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[18%]">Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="w-[14%]">SKU</TableHead>
                <TableHead className="w-[16%]">Tipo</TableHead>
                <TableHead className="w-[12%] text-right">Quantidade</TableHead>
                <TableHead className="w-[12%]">Pedido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                  </TableRow>
                ))
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="py-2.5 tabular-nums">{formatDateTime(t.created_at)}</TableCell>
                    <TableCell className="py-2.5"><div className="truncate font-medium">{productLabel(t)}</div></TableCell>
                    <TableCell className="py-2.5 font-mono text-xs">{t.sku || '-'}</TableCell>
                    <TableCell className="py-2.5"><StatusBadge {...inventoryTypeBadge(t.type)} /></TableCell>
                    <TableCell className={`py-2.5 text-right font-semibold tabular-nums ${t.quantity_changed < 0 ? 'text-destructive' : 'text-success'}`}>
                      {t.quantity_changed > 0 ? `+${t.quantity_changed}` : t.quantity_changed}
                    </TableCell>
                    <TableCell className="py-2.5 font-mono text-xs">{t.order_id ? `#${t.order_id.slice(0, 8)}` : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data ? (
            <DataTablePagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} onLimitChange={changeLimit} />
          ) : null}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste manual de estoque</DialogTitle>
            <DialogDescription>Registre uma entrada (reposição), saída ou correção de contagem.</DialogDescription>
          </DialogHeader>
          <CreateInventoryForm onSubmit={(payload) => createMutation.mutate(payload)} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateInventoryForm({ onSubmit, isPending }: { onSubmit: (payload: CreateInventoryPayload) => void; isPending: boolean }) {
  const [variant, setVariant] = useState<PickedVariant | null>(null);
  const [type, setType] = useState<string>('');
  const [quantity, setQuantity] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variant || !type || quantity === '') return;

    const numQuantity = Number(quantity);
    if (type === 'SALE' && numQuantity >= 0) {
      toast.error('Saída deve ter quantidade negativa');
      return;
    }
    if (type === 'RESTOCK' && numQuantity <= 0) {
      toast.error('Reposição deve ter quantidade positiva');
      return;
    }

    onSubmit({ variant_id: variant.variant_id, type: type as CreateInventoryPayload['type'], quantity_changed: numQuantity });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Produto</Label>
        <VariantPicker value={variant} onSelect={setVariant} />
        {variant ? <p className="text-xs text-muted-foreground">Estoque atual: {variant.stock_quantity}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESTOCK">Reposição (entrada)</SelectItem>
            <SelectItem value="SALE">Saída avulsa</SelectItem>
            <SelectItem value="ADJUSTMENT">Correção de contagem</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          type="number"
          placeholder={type === 'SALE' ? 'Ex.: -2' : type === 'RESTOCK' ? 'Ex.: 10' : 'Positiva ou negativa'}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        {type ? (
          <p className="text-xs text-muted-foreground">
            {type === 'SALE' ? 'Use um valor negativo.' : type === 'RESTOCK' ? 'Use um valor positivo.' : 'Positivo para somar, negativo para subtrair.'}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !variant || !type || quantity === ''}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrando...</> : 'Registrar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
