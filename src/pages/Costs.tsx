import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MoreHorizontal, AlertTriangle, Loader2, BadgePercent } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi } from '@/services/api';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { typeLabel, categoryLabel, calculationBaseLabel, formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DataTablePagination from '@/components/DataTablePagination';
import CostComponentFormDialog from '@/components/costs/CostComponentFormDialog';
import SimulateCostDialog from '@/components/costs/SimulateCostDialog';
import ProductAssociationsDialog from '@/components/costs/ProductAssociationsDialog';
import type { CostComponent, CostComponentPayload } from '@/types';

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

export default function Costs() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const { search, debouncedSearch, changeSearch, filter, changeFilter } =
    useTableFilters<{ is_active?: boolean }>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostComponent | null>(null);
  const [deleting, setDeleting] = useState<CostComponent | null>(null);
  const [simulating, setSimulating] = useState<CostComponent | null>(null);
  const [associationsFor, setAssociationsFor] = useState<CostComponent | null>(null);

  const { data: components, isLoading, isError, refetch } = useQuery({
    queryKey: ['cost-components', debouncedSearch, filter],
    queryFn: () => costComponentsApi.list({
      search: debouncedSearch || undefined,
      is_active: filter?.is_active,
    }),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['cost-components'] });
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (payload: CostComponentPayload) => costComponentsApi.create(payload),
    onSuccess: () => {
      toast.success('Componente criado com sucesso');
      setFormOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(`Falha ao criar: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CostComponentPayload> }) => costComponentsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Componente atualizado');
      setFormOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(`Falha ao atualizar: ${err?.response?.data?.error || err?.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => costComponentsApi.delete(id),
    onSuccess: () => {
      toast.success('Componente excluído');
      setDeleting(null);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(`Falha ao excluir: ${err?.response?.data?.error || err?.message}`),
  });

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Custos</h1>
        <p className="text-sm text-muted-foreground">Componentes que compõem o custo dos produtos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar componente..."
            className="pl-9"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
        <Select
          value={filter?.is_active === undefined ? 'all' : String(filter.is_active)}
          onValueChange={(value) => changeFilter(value === 'all' ? undefined : { is_active: value === 'true' })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
        {admin ? (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Componente
          </Button>
        ) : null}
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar componentes</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : components?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BadgePercent className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum componente encontrado</p>
            <p className="text-sm">Tente ajustar a busca ou crie um novo componente.</p>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Nome</TableHead>
                <TableHead className="w-[14%]">Tipo</TableHead>
                <TableHead className="w-[14%]">Categoria</TableHead>
                <TableHead className="w-[14%] text-right">Valor</TableHead>
                <TableHead className="w-[14%]">Base de cálculo</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[12%] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(components ?? []).map((component) => (
                <TableRow key={component.id}>
                  <TableCell>
                    <span className="font-medium truncate block">{component.name}</span>
                    {component.description ? (
                      <span className="text-xs text-muted-foreground truncate block">{component.description}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{typeLabel(component.type)}</TableCell>
                  <TableCell>{categoryLabel(component.category)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(component.value)}</TableCell>
                  <TableCell>
                    {component.type === 'PERCENT' ? calculationBaseLabel(component.calculation_base) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={component.is_active ? 'default' : 'secondary'} className={component.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent' : ''}>
                      {component.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {admin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(component); setFormOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSimulating(component)}>
                            Simular custo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAssociationsFor(component)}>
                            Associações
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(component)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CostComponentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        component={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(payload) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, payload });
          } else {
            createMutation.mutate(payload);
          }
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir componente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleting?.name}"? A ação pode afetar o cálculo de custos dos produtos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SimulateCostDialog open={simulating !== null} onOpenChange={(open) => { if (!open) setSimulating(null); }} />
      <ProductAssociationsDialog open={associationsFor !== null} onOpenChange={(open) => { if (!open) setAssociationsFor(null); }} />
    </div>
  );
}
