import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, UsersIcon } from 'lucide-react';
import { customersApi } from '@/services/api';
import { useTableFilters } from '@/hooks/useTableFilters';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import DataTablePagination from '@/components/DataTablePagination';
import CustomerDetailDrawer from '@/components/customers/CustomerDetailDrawer';
import type { Customer } from '@/types';

export default function Customers() {
  const { page, limit, search, debouncedSearch, setPage, changeSearch, changeLimit } = useTableFilters();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Base de clientes cadastrada a partir dos pedidos</p>
      </div>

      <div className="relative max-w-md shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou email..."
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
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Nome</TableHead>
                <TableHead className="w-[22%]">Email</TableHead>
                <TableHead className="w-[10%]">Cidade</TableHead>
                <TableHead className="w-[8%]">UF</TableHead>
                <TableHead className="w-[8%] text-right">Pedidos</TableHead>
                <TableHead className="w-[14%] text-right">Total gasto</TableHead>
                <TableHead className="w-[12%] text-right">Ticket médio</TableHead>
                <TableHead className="w-[12%] text-right">Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleRowClick(customer)}>
                  <TableCell className="font-medium truncate block">{customer.name}</TableCell>
                  <TableCell className="truncate block text-sm text-muted-foreground">{customer.email ?? '-'}</TableCell>
                  <TableCell>{customer.city ?? '-'}</TableCell>
                  <TableCell>{customer.province ?? '-'}</TableCell>
                  <TableCell className="text-right">{customer.order_count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.average_ticket)}</TableCell>
                  <TableCell className="text-right">{formatDate(customer.last_purchase_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      <CustomerDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} customer={selectedCustomer} />
    </div>
  );
}
