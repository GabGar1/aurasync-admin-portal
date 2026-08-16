import { useState } from 'react';
import { Search, Plus, MoreHorizontal, AlertTriangle, UsersIcon, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, getFriendlyError } from '@/services/api';
import type { User, CreateUserPayload, UpdateUserPayload, GetUsersResponse } from '@/types';
import { useTableFilters } from '@/hooks/useTableFilters';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { formatDate, roleLabel } from '@/lib/formatters';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import DataTablePagination from '@/components/DataTablePagination';
import { Label } from '@/components/ui/label';

function RoleBadge({ role }: { role: string }) {
  if (role === 'ADMIN') {
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-transparent">{roleLabel(role)}</Badge>;
  }
  if (role === 'SUPER_ADMIN') {
    return <Badge variant="outline" className="text-purple-700 border-purple-300">{roleLabel(role)}</Badge>;
  }
  return <Badge variant="secondary">{roleLabel(role)}</Badge>;
}

function StatusDisplay({ status }: { status: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${status ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-sm">{status ? 'Ativo' : 'Inativo'}</span>
    </span>
  );
}

export default function Users() {
  const { getUser } = useAuth();
  const currentUser = getUser();
  const admin = isAdmin(currentUser?.role);
  const qc = useQueryClient();

  const { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter } = useTableFilters<{ role: string }>();
  const roleFilter = filter?.role ?? 'all';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<GetUsersResponse>({
    queryKey: ['users', page, limit, debouncedSearch, roleFilter],
    queryFn: () => usersApi.getAll({
      page,
      limit,
      search: debouncedSearch || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso');
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreateDialogOpen(false);
    },
    onError: (err) => toast.error(
      `Falha ao criar: ${getFriendlyError(err)}`
    ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      toast.success('Usuário atualizado');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (err) => toast.error(
      `Falha ao atualizar: ${getFriendlyError(err)}`
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('Usuário removido');
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: (err) => toast.error(
      `Falha ao remover: ${getFriendlyError(err)}`
    ),
  });

  const users = data?.users || [];

  function handleEditClick(user: User) {
    setEditingUser(user);
    setEditDialogOpen(true);
  }

  function handleDeleteClick(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (deletingUser) {
      deleteMutation.mutate(deletingUser.id);
    }
  }

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Usuários</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de usuários do sistema</p>
          </div>
          {admin && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Usuário
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => { changeSearch(e.target.value); }}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => { changeFilter(value === 'all' ? undefined : { role: value }); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Funções</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex items-center justify-center py-16">
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar usuários</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : users.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <UsersIcon className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum usuário encontrado</p>
          <p className="text-sm">Tente ajustar os filtros ou crie um novo usuário.</p>
          {admin ? (
            <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Novo Usuário
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <Table className="table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                {admin && <TableHead className="w-[80px] text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    {admin && <TableCell><Skeleton className="h-8 w-8 mx-auto rounded" /></TableCell>}
                  </TableRow>
                ))
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusDisplay status={user.status} />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    {admin && (
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && (
            <DataTablePagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={setPage}
              onLimitChange={changeLimit}
            />
          )}
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Preencha os dados para criar um novo usuário</DialogDescription>
          </DialogHeader>
          <CreateUserForm
            onSubmit={(payload) => createMutation.mutate(payload)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize os dados do usuário</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              onSubmit={(payload) => updateMutation.mutate({ id: editingUser.id, payload })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {deletingUser?.first_name} {deletingUser?.last_name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateUserForm({ onSubmit, isPending }: { onSubmit: (payload: CreateUserPayload) => void; isPending: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) return;
    onSubmit({
      email: email.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="create-email">Email</Label>
        <Input
          id="create-email"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-password">Senha</Label>
        <Input
          id="create-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-first_name">Nome</Label>
        <Input
          id="create-first_name"
          placeholder="Nome"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-last_name">Sobrenome</Label>
        <Input
          id="create-last_name"
          placeholder="Sobrenome"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !email.trim() || !password || !firstName.trim() || !lastName.trim()}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditUserForm({ user, onSubmit, isPending }: { user: User; onSubmit: (payload: UpdateUserPayload) => void; isPending: boolean }) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [status, setStatus] = useState(user.status ? 'active' : 'inactive');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      status: status === 'active',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-first_name">Nome</Label>
        <Input
          id="edit-first_name"
          placeholder="Nome"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-last_name">Sobrenome</Label>
        <Input
          id="edit-last_name"
          placeholder="Sobrenome"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="edit-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending || !firstName.trim() || !lastName.trim()}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}
