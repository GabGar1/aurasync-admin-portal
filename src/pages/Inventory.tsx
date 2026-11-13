import { useState } from 'react';
import { Plus, AlertTriangle, Database, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, getFriendlyError } from '@/services/api';
import type { CreateInventoryPayload, GetInventoryResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/permissions';
import { formatDate } from '@/lib/formatters';
import { inventoryTypeBadge } from '@/lib/status';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function Inventory() {
  const { user } = useAuth();
  const admin = can(user?.role, 'inventory.adjust');
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<GetInventoryResponse>({
    queryKey: ['inventory', page, limit],
    queryFn: () => inventoryApi.getAll({ page, limit }),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateInventoryPayload) => inventoryApi.create(payload),
    onSuccess: () => {
      toast.success('Ajuste de inventário registrado');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setDialogOpen(false);
    },
    onError: (err) => toast.error(
      `Falha ao registrar: ${getFriendlyError(err)}`
    ),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const transactions = data?.transactions || [];

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

      {isError ? (
        <div className="flex items-center justify-center py-16">
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar movimentações</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : transactions.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Database className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhuma movimentação encontrada</p>
          <p className="text-sm">Nenhuma movimentação de estoque registrada até o momento.</p>
        </div>
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[560px]">
            <TableHeader className="bg-background">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>ID da variação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>ID do pedido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="tabular-nums">{formatDate(t.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs"><span className="block truncate">{t.variant_id}</span></TableCell>
                    <TableCell><StatusBadge {...inventoryTypeBadge(t.type)} /></TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${t.quantity_changed < 0 ? 'text-destructive' : 'text-success'}`}>
                      {t.quantity_changed > 0 ? `+${t.quantity_changed}` : t.quantity_changed}
                    </TableCell>
                    <TableCell className="font-mono text-xs"><span className="block truncate">{t.order_id ? t.order_id.slice(0, 8) : '-'}</span></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste manual de estoque</DialogTitle>
            <DialogDescription>Registre uma entrada, saída ou correção de estoque</DialogDescription>
          </DialogHeader>
          <CreateInventoryForm
            onSubmit={(payload) => createMutation.mutate(payload)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateInventoryForm({ onSubmit, isPending }: { onSubmit: (payload: CreateInventoryPayload) => void; isPending: boolean }) {
  const [variantId, setVariantId] = useState('');
  const [type, setType] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [orderId, setOrderId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variantId.trim() || !type || quantity === '') return;

    const numQuantity = Number(quantity);
    if (type === 'SALE' && numQuantity >= 0) {
      toast.error('Venda deve ter quantidade negativa');
      return;
    }
    if (type === 'RESTOCK' && numQuantity <= 0) {
      toast.error('Reabastecimento deve ter quantidade positiva');
      return;
    }

    onSubmit({
      variant_id: variantId.trim(),
      type: type as CreateInventoryPayload['type'],
      quantity_changed: numQuantity,
      order_id: orderId.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="variant_id">ID da variação</Label>
        <Input
          id="variant_id"
          placeholder="ID da variação"
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SALE">Venda (negativo)</SelectItem>
            <SelectItem value="RESTOCK">Reabastecimento (positivo)</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajuste manual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          type="number"
          placeholder={type === 'SALE' ? 'Use valor negativo' : type === 'RESTOCK' ? 'Use valor positivo' : 'Quantidade'}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        {type && (
          <p className="text-xs text-muted-foreground">
            {type === 'SALE' ? 'Use valor negativo para venda' : type === 'RESTOCK' ? 'Use valor positivo para reabastecimento' : 'Pode ser positivo ou negativo'}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="order_id">ID do pedido (opcional)</Label>
        <Input
          id="order_id"
          placeholder="ID do pedido relacionado"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !variantId.trim() || !type || quantity === ''}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</> : 'Registrar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
