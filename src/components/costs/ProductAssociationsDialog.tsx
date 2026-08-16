import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi, productSubgroupsApi, productsApi, getFriendlyError } from '@/services/api';
import { categoryLabel, typeLabel, formatCurrency } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CostAssociation, CostComponent } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductAssociationsDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState('1');

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['assoc-products', search],
    queryFn: () => productsApi.getAll({ search: search || undefined, limit: 10 }),
    enabled: open,
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['cost-components'],
    queryFn: () => costComponentsApi.list({ is_active: true }),
    enabled: open && addOpen,
  });

  const { data: subgroupsData } = useQuery({
    queryKey: ['product-subgroups'],
    queryFn: () => productSubgroupsApi.list(),
    enabled: open,
  });

  const { data: associationsData, isLoading: associationsLoading, isError } = useQuery({
    queryKey: ['cost-associations', productId],
    queryFn: () => costComponentsApi.getByProduct(productId),
    enabled: open && !!productId,
  });

  const subgroupNames = useMemo(
    () => new Map((subgroupsData ?? []).map((subgroup) => [subgroup.id, subgroup.name])),
    [subgroupsData],
  );

  useEffect(() => {
    if (!open) {
      setProductId('');
      setProductName('');
      setSelectedSubgroupId(null);
      setSearch('');
      setAddOpen(false);
      setSelectedIds(new Set());
      setQuantity('1');
    }
  }, [open]);

  const addMutation = useMutation({
    mutationFn: () => costComponentsApi.associateProductBatch({
      product_id: productId,
      cost_component_ids: [...selectedIds],
      quantity: parseInt(quantity, 10) || 1,
    }),
    onSuccess: () => {
      toast.success('Componentes associados ao produto');
      setAddOpen(false);
      setSelectedIds(new Set());
      setQuantity('1');
      qc.invalidateQueries({ queryKey: ['cost-associations', productId] });
    },
    onError: (err) => toast.error(`Falha ao associar: ${getFriendlyError(err)}`),
  });

  const removeMutation = useMutation({
    mutationFn: (associationId: string) => costComponentsApi.removeAssociation(associationId),
    onSuccess: () => {
      toast.success('Associação removida');
      qc.invalidateQueries({ queryKey: ['cost-associations', productId] });
    },
    onError: (err) => toast.error(`Falha ao remover: ${getFriendlyError(err)}`),
  });

  const availableComponents = (componentsData ?? []).filter(
    (component: CostComponent) => !(associationsData?.associations ?? []).some(
      (association) => association.cost_component_id === component.id
    )
  );

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Associações de Componentes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assoc-product-search">Produto</Label>
            <Input
              id="assoc-product-search"
              placeholder="Buscar produto..."
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setSearch(e.target.value);
              }}
            />
            {productsLoading ? <Skeleton className="h-10 w-full" /> : productsData?.products.length ? (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {productsData.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => {
                      setProductId(product.id);
                      setProductName(product.name);
                      setSelectedSubgroupId(product.subgroup_id ?? null);
                      setSearch('');
                    }}
                  >
                    <span className="font-medium truncate">{product.name}</span>
                    {product.subgroup_id && subgroupNames.has(product.subgroup_id) ? (
                      <Badge variant="outline" className="shrink-0">{subgroupNames.get(product.subgroup_id)}</Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
            {productId && selectedSubgroupId && subgroupNames.has(selectedSubgroupId) ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{productName}</span>
                <Badge variant="outline" className="shrink-0">{subgroupNames.get(selectedSubgroupId)}</Badge>
              </div>
            ) : null}
          </div>

          {productId ? (
            <div className="space-y-3">
              {associationsLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar associações</AlertTitle>
                </Alert>
              ) : (associationsData?.associations ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum componente associado a este produto
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Componente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-center">Remover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(associationsData?.associations ?? []).map((association: CostAssociation) => (
                      <TableRow key={association.id}>
                        <TableCell className="font-medium">{association.component?.name ?? association.cost_component_id}</TableCell>
                        <TableCell>{association.component ? typeLabel(association.component.type) : '-'}</TableCell>
                        <TableCell>{association.component ? categoryLabel(association.component.category) : '-'}</TableCell>
                        <TableCell className="text-right">{association.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeMutation.mutate(association.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {addOpen ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Componentes</Label>
                    {componentsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 w-full" />
                        ))}
                      </div>
                    ) : availableComponents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Todos os componentes ativos já estão associados a este produto
                      </p>
                    ) : (
                      <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                        {availableComponents.map((component) => (
                          <label key={component.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted">
                            <Checkbox
                              checked={selectedIds.has(component.id)}
                              onCheckedChange={(checked) => toggleSelected(component.id, checked === true)}
                            />
                            <span className="text-sm font-medium truncate">{component.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {component.type === 'PERCENT' ? `${component.value}%` : formatCurrency(component.value)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-2 w-[120px]">
                      <Label htmlFor="assoc-qty">Qtd</Label>
                      <Input id="assoc-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <Button size="sm" disabled={selectedIds.size === 0 || addMutation.isPending} onClick={() => addMutation.mutate()}>
                      {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Associar ({selectedIds.size})
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Componente
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
