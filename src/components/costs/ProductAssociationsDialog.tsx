import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi, productsApi } from '@/services/api';
import { categoryLabel, typeLabel, formatCurrency } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CostAssociation, CostComponent } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

export default function ProductAssociationsDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [componentId, setComponentId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search: search || undefined, limit: 10 }),
    enabled: open,
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['cost-components'],
    queryFn: () => costComponentsApi.list({ is_active: true }),
    enabled: open && addOpen,
  });

  const { data: associationsData, isLoading: associationsLoading, isError } = useQuery({
    queryKey: ['cost-associations', productId],
    queryFn: () => costComponentsApi.getByProduct(productId),
    enabled: open && !!productId,
  });

  useEffect(() => {
    if (!open) {
      setProductId('');
      setProductName('');
      setSearch('');
      setAddOpen(false);
      setComponentId('');
      setQuantity('1');
    }
  }, [open]);

  const addMutation = useMutation({
    mutationFn: () => costComponentsApi.associate({ product_id: productId, cost_component_id: componentId, quantity: parseInt(quantity) || 1 }),
    onSuccess: () => {
      toast.success('Componente associado ao produto');
      setAddOpen(false);
      setComponentId('');
      setQuantity('1');
      qc.invalidateQueries({ queryKey: ['cost-associations', productId] });
    },
    onError: (err: ApiError) => toast.error(`Falha ao associar: ${err?.response?.data?.error || err?.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: (associationId: string) => costComponentsApi.removeAssociation(associationId),
    onSuccess: () => {
      toast.success('Associação removida');
      qc.invalidateQueries({ queryKey: ['cost-associations', productId] });
    },
    onError: (err: ApiError) => toast.error(`Falha ao remover: ${err?.response?.data?.error || err?.message}`),
  });

  const availableComponents = (componentsData ?? []).filter(
    (component: CostComponent) => !(associationsData?.associations ?? []).some(
      (association) => association.cost_component_id === component.id
    )
  );

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
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setProductId(product.id);
                      setProductName(product.name);
                      setSearch('');
                    }}
                  >
                    {product.name}
                  </button>
                ))}
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
                  <div className="grid grid-cols-[1fr_90px] gap-3">
                    <div className="space-y-2">
                      <Label>Componente</Label>
                      {componentsLoading ? <Skeleton className="h-10 w-full" /> : (
                        <Select value={componentId} onValueChange={setComponentId}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {availableComponents.map((component) => (
                              <SelectItem key={component.id} value={component.id}>
                                {component.name} ({formatCurrency(component.value)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assoc-qty">Qtd</Label>
                      <Input id="assoc-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!componentId || addMutation.isPending} onClick={() => addMutation.mutate()}>
                      {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Associar
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
