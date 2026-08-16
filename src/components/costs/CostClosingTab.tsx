import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarRange, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { costClosingApi, getFriendlyError } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { allocationBasisLabel, formatDateOnly, typeLabel } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CostClosingResponse } from '@/types';

export default function CostClosingTab() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const [month, setMonth] = useState('');
  const [lastResult, setLastResult] = useState<CostClosingResponse | null>(null);

  const closeMutation = useMutation({
    mutationFn: () => costClosingApi.close({ month }),
    onSuccess: (result) => {
      setLastResult(result);
      toast.success('Fechamento concluído');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard-orders'] });
    },
    onError: (err) => toast.error(`Falha no fechamento: ${getFriendlyError(err)}`),
  });

  return (
    <div className="flex flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fechar mês</CardTitle>
          <CardDescription>
            Gera as alocações das camadas mensais para o período selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {admin ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="sm:max-w-[220px]"
              />
              <Button
                onClick={() => closeMutation.mutate()}
                disabled={!month || closeMutation.isPending}
              >
                {closeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
                Fechar mês
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Apenas administradores podem fechar o mês.
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            O fechamento é idempotente — rodar novamente recalcula e sobrescreve o mesmo mês.
          </p>
        </CardContent>
      </Card>

      {lastResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {formatDateOnly(lastResult.period.start)} — {formatDateOnly(lastResult.period.end)}
            </CardTitle>
            <CardDescription>Resultado do fechamento mensal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-semibold">{lastResult.orders}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Produtos</p>
                <p className="text-2xl font-semibold">{lastResult.products}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Alocações</p>
                <p className="text-2xl font-semibold">{lastResult.allocations}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Componentes mensais</h4>
              {lastResult.components.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhum componente mensal ativo no período.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Base de rateio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lastResult.components.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>{typeLabel(component.type)}</TableCell>
                        <TableCell>{allocationBasisLabel(component.allocation_basis)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarRange className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum fechamento ainda</p>
          <p className="text-sm">Selecione um mês e clique em "Fechar mês" para gerar as alocações mensais.</p>
        </div>
      )}
    </div>
  );
}
