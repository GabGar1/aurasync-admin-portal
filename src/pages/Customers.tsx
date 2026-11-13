import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, UsersIcon, Plus } from 'lucide-react';
import { customersApi } from '@/services/api';
import { useTableFilters } from '@/hooks/useTableFilters';
import { formatCurrency, formatDate, provinceCode } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import DataTablePagination from '@/components/DataTablePagination';
import CustomerDetailDrawer from '@/components/customers/CustomerDetailDrawer';
import CreateCustomerDialog from '@/components/sales/CreateCustomerDialog';
import type { Customer } from '@/types';

export default function Customers() {
  const { page, limit, search, debouncedSearch, setPage, changeSearch, changeLimit } = useTableFilters();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', page, limit, debouncedSearch],
    queryFn: () => customersApi.getAll({
      page, limit,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const customers = data?.customers || [];

  function handleRowClick(customer: Customer) {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  }

  return (
    <div className="flex flex-col space-y-6 p-4 motion-safe:animate-fade-in-up sm:p-6">
      <PageHeader
        title="Clientes"
        description="Base de clientes montada a partir dos pedidos"
        actions={
          <Button onClick={() => setCustomerDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar cliente
          </Button>
        }
      />

      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou e-mail..."
          aria-label="Pesquisar clientes"
          className="pl-9"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
        />
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar clientes</AlertTitle>
              <AlertDescription>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm">Tente ajustar a busca.</p>
          </div>
        ) : (
          <>
          <ul className="space-y-2 md:hidden" aria-label="Clientes">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border bg-card p-3 text-left"
                  onClick={() => handleRowClick(customer)}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{customer.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(customer.total_spent)}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{customer.email ?? 'Sem e-mail'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {customer.order_count} pedido{customer.order_count === 1 ? '' : 's'}
                    {customer.city ? ` · ${customer.city}/${provinceCode(customer.province)}` : ''}
                    {' · última compra '}{formatDate(customer.last_purchase_at ?? customer.first_purchase_at)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <Table className="hidden table-fixed md:table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Nome</TableHead>
                <TableHead className="w-[22%]">E-mail</TableHead>
                <TableHead className="w-[12%]">Cidade</TableHead>
                <TableHead className="w-[6%]">UF</TableHead>
                <TableHead className="w-[8%] text-right">Pedidos</TableHead>
                <TableHead className="w-[14%] text-right">Total gasto</TableHead>
                <TableHead className="w-[12%] text-right">Ticket médio</TableHead>
                <TableHead className="w-[12%] text-right">Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleRowClick(customer)}>
                  <TableCell>
                    <div className="truncate font-medium">{customer.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate text-sm text-muted-foreground">{customer.email ?? '-'}</div>
                  </TableCell>
                  <TableCell><div className="truncate">{customer.city ?? '-'}</div></TableCell>
                  <TableCell title={customer.province ?? undefined}>{provinceCode(customer.province)}</TableCell>
                  <TableCell className="text-right tabular-nums">{customer.order_count}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(customer.average_ticket)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatDate(customer.last_purchase_at ?? customer.first_purchase_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>
        )}
      </div>

      {data ? (
        <DataTablePagination
          page={data.page}
          limit={data.limit}
          total={data.total}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      ) : null}

      <CreateCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onCreated={() => setCustomerDialogOpen(false)}
      />

      <CustomerDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} customer={selectedCustomer} />
    </div>
  );
}
