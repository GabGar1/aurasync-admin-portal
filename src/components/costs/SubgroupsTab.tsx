import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Layers, Loader2, MoreHorizontal, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { productSubgroupsApi, getFriendlyError } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
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
import SubgroupFormDialog from '@/components/costs/SubgroupFormDialog';
import SubgroupProductsDialog from '@/components/costs/SubgroupProductsDialog';
import SubgroupComponentsDialog from '@/components/costs/SubgroupComponentsDialog';
import type { ProductSubgroup, ProductSubgroupPayload } from '@/types';

export default function SubgroupsTab() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductSubgroup | null>(null);
  const [productsFor, setProductsFor] = useState<ProductSubgroup | null>(null);
  const [componentsFor, setComponentsFor] = useState<ProductSubgroup | null>(null);
  const [deleting, setDeleting] = useState<ProductSubgroup | null>(null);

  const { data: subgroups, isLoading, isError, refetch } = useQuery({
    queryKey: ['product-subgroups', debouncedSearch, statusFilter],
    queryFn: () => productSubgroupsApi.list({
      search: debouncedSearch || undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'true',
    }),
    placeholderData: (previousData) => previousData,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['product-subgroups'] });
    qc.invalidateQueries({ queryKey: ['products'] });
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (payload: ProductSubgroupPayload) => productSubgroupsApi.create(payload),
    onSuccess: () => {
      toast.success('Subgrupo criado com sucesso');
      setFormOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(`Falha ao criar: ${getFriendlyError(err)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductSubgroupPayload> }) => productSubgroupsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Subgrupo atualizado');
      setFormOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(`Falha ao atualizar: ${getFriendlyError(err)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productSubgroupsApi.remove(id),
    onSuccess: () => {
      toast.success('Subgrupo excluído');
      setDeleting(null);
      invalidate();
    },
    onError: (err) => toast.error(`Falha ao excluir: ${getFriendlyError(err)}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar subgrupo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'true' | 'false')}>
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
            Novo Subgrupo
          </Button>
        ) : null}
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar subgrupos</AlertTitle>
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
        ) : (subgroups ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Layers className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum subgrupo encontrado</p>
            <p className="text-sm">Tente ajustar a busca ou crie um novo subgrupo.</p>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[55%]">Nome</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[25%] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(subgroups ?? []).map((subgroup) => (
                <TableRow key={subgroup.id}>
                  <TableCell>
                    <span className="font-medium truncate block">{subgroup.name}</span>
                    {subgroup.description ? (
                      <span className="text-xs text-muted-foreground truncate block">{subgroup.description}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subgroup.is_active ? 'default' : 'secondary'} className={subgroup.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent' : ''}>
                      {subgroup.is_active ? 'Ativo' : 'Inativo'}
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
                          <DropdownMenuItem onClick={() => { setEditing(subgroup); setFormOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setProductsFor(subgroup)}>
                            Produtos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setComponentsFor(subgroup)}>
                            Componentes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(subgroup)}>
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

      <SubgroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subgroup={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(payload) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, payload });
          } else {
            createMutation.mutate(payload);
          }
        }}
      />

      <SubgroupProductsDialog
        open={productsFor !== null}
        onOpenChange={(open) => { if (!open) setProductsFor(null); }}
        subgroup={productsFor}
      />

      <SubgroupComponentsDialog
        open={componentsFor !== null}
        onOpenChange={(open) => { if (!open) setComponentsFor(null); }}
        subgroup={componentsFor}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir subgrupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleting?.name}"? Os produtos associados ficarão sem subgrupo.
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
    </div>
  );
}
