import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi, getFriendlyError } from '@/services/api';
import { typeLabel } from '@/lib/formatters';
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

export default function SubgroupComponentsDialog({ open, onOpenChange, subgroup }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addSelected, setAddSelected] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState('1');

  const { data: associationsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['subgroup-components', subgroup?.id],
    queryFn: () => costComponentsApi.getBySubgroup(subgroup!.id),
    enabled: open && !!subgroup,
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['cost-components'],
    queryFn: () => costComponentsApi.list({ is_active: true }),
    enabled: open && !!subgroup,
  });

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setAddSelected(new Set());
      setQuantity('1');
    }
  }, [open]);

  const addMutation = useMutation({
    mutationFn: () => costComponentsApi.associateSubgroupBatch({
      subgroup_id: subgroup!.id,
      cost_component_ids: [...addSelected],
      quantity: parseInt(quantity, 10) || 1,
    }),
    onSuccess: () => {
      toast.success('Componentes vinculados ao subgrupo');
      setAddSelected(new Set());
      setQuantity('1');
      qc.invalidateQueries({ queryKey: ['subgroup-components', subgroup?.id] });
    },
    onError: (err) => toast.error(`Falha ao vincular: ${getFriendlyError(err)}`),
  });

  const removeMutation = useMutation({
    mutationFn: () => costComponentsApi.removeSubgroupAssociations({
      subgroup_id: subgroup!.id,
      cost_component_ids: [...selected],
    }),
    onSuccess: () => {
      toast.success('Associações removidas');
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['subgroup-components', subgroup?.id] });
    },
    onError: (err) => toast.error(`Falha ao remover: ${getFriendlyError(err)}`),
  });

  const associations = associationsData?.associations ?? [];

  const availableComponents = (componentsData ?? []).filter(
    (component) => !associations.some((association) => association.cost_component_id === component.id)
  );

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAddSelected(id: string, checked: boolean) {
    setAddSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Componentes do Subgrupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Componentes vinculados</Label>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar componentes</AlertTitle>
                <AlertDescription>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
                </AlertDescription>
              </Alert>
            ) : associations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum componente vinculado a este subgrupo</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="w-[50px] text-center">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {associations.map((association) => (
                    <TableRow key={association.id}>
                      <TableCell className="font-medium">
                        <span className="truncate block">
                          {association.component?.name ?? association.cost_component_id.slice(0, 12)}
                        </span>
                      </TableCell>
                      <TableCell>{association.component ? typeLabel(association.component.type) : '-'}</TableCell>
                      <TableCell className="text-right">{association.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selected.has(association.cost_component_id)}
                          onCheckedChange={(checked) => toggleSelected(association.cost_component_id, checked === true)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {selected.size > 0 ? (
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate()}
                >
                  {removeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Remover selecionados ({selected.size})
                </Button>
              </div>
            ) : null}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Label>Adicionar componentes</Label>
            {componentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : availableComponents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os componentes ativos já estão vinculados a este subgrupo</p>
            ) : (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {availableComponents.map((component) => (
                  <label key={component.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={addSelected.has(component.id)}
                      onCheckedChange={(checked) => toggleAddSelected(component.id, checked === true)}
                    />
                    <span className="text-sm font-medium truncate">{component.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{typeLabel(component.type)}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-2 w-[120px]">
                <Label htmlFor="subgroup-component-qty">Quantidade</Label>
                <Input
                  id="subgroup-component-qty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                disabled={addSelected.size === 0 || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Adicionar ({addSelected.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
