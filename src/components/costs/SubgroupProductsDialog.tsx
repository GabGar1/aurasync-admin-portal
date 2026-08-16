import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { productSubgroupsApi, productsApi, getFriendlyError } from '@/services/api';
import { categoryLabel } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ProductSubgroup } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgroup: ProductSubgroup | null;
}

export default function SubgroupProductsDialog({ open, onOpenChange, subgroup }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: listData, isLoading: listLoading, isError, refetch } = useQuery({
    queryKey: ['subgroup-products', subgroup?.id, page, search],
    queryFn: () => productSubgroupsApi.listProducts(subgroup!.id, {
      page,
      limit: 10,
      search: search || undefined,
    }),
    enabled: open && !!subgroup,
  });

  const { data: assignData, isLoading: assignLoading } = useQuery({
    queryKey: ['subgroup-assign-products', assignSearch],
    queryFn: () => productsApi.getAll({ search: assignSearch || undefined, limit: 20 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setPage(1);
      setSearch('');
      setAssignSearch('');
      setSelected(new Set());
    }
  }, [open]);

  const unassignMutation = useMutation({
    mutationFn: (productId: string) => productSubgroupsApi.unassignProduct(subgroup!.id, productId),
    onSuccess: () => {
      toast.success('Produto desvinculado do subgrupo');
      qc.invalidateQueries({ queryKey: ['subgroup-products', subgroup?.id] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(`Falha ao desvincular: ${getFriendlyError(err)}`),
  });

  const assignMutation = useMutation({
    mutationFn: (productIds: string[]) => productSubgroupsApi.assignProducts(subgroup!.id, productIds),
    onSuccess: (res) => {
      toast.success(`${res.assigned} produto(s) atribuído(s)`);
      setSelected(new Set());
      setAssignSearch('');
      qc.invalidateQueries({ queryKey: ['subgroup-products', subgroup?.id] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(`Falha ao atribuir: ${getFriendlyError(err)}`),
  });

  function toggleSelected(productId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  const total = listData?.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Produtos do Subgrupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Produtos do subgrupo</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar neste subgrupo..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {listLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar produtos</AlertTitle>
                <AlertDescription>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
                </AlertDescription>
              </Alert>
            ) : (listData?.products ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum produto neste subgrupo</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-[110px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listData?.products ?? []).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category ? categoryLabel(product.category) : '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => unassignMutation.mutate(product.id)}
                          disabled={unassignMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {total > 10 ? (
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">Página {page}</span>
                <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>
                  Próximo
                </Button>
              </div>
            ) : null}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Label>Atribuir produtos</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto para atribuir..."
                className="pl-9"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
            </div>
            {assignLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (assignData?.products ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
            ) : (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {(assignData?.products ?? []).map((product) => (
                  <label key={product.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={(checked) => toggleSelected(product.id, checked === true)}
                    />
                    <span className="text-sm font-medium truncate">{product.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {product.category ? categoryLabel(product.category) : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={selected.size === 0 || assignMutation.isPending}
                onClick={() => assignMutation.mutate([...selected])}
              >
                {assignMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Atribuir ({selected.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
