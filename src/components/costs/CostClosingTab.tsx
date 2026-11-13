import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarRange, Loader2, Lock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { costClosingApi, getFriendlyError } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { allocationBasisLabel, formatCurrency, formatDateOnly, formatDateTime, typeLabel } from '@/lib/formatters';
import { monthLabel, monthOptions } from '@/lib/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CostClosingRecord, CostClosingResponse } from '@/types';

/** "2026-08-01".."2026-09-01" (end exclusive) -> "agosto de 2026"; other ranges as dates. */
function periodLabel(start: string, end: string) {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  const isWholeMonth = s.getDate() === 1 && e.getDate() === 1 && (e.getMonth() - s.getMonth() + 12) % 12 === 1;
  if (isWholeMonth) return monthLabel(s);
  e.setDate(e.getDate() - 1);
  return `${formatDateOnly(start)} a ${e.toLocaleDateString('pt-BR')}`;
}

export default function CostClosingTab() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();
  const months = monthOptions();

  // Default: the previous month, the one usually being closed.
  const [month, setMonth] = useState(months[1]?.value ?? months[0]!.value);
  const [lastResult, setLastResult] = useState<CostClosingResponse | null>(null);

  const history = useQuery({ queryKey: ['cost-closings'], queryFn: costClosingApi.list });

  const closeMutation = useMutation({
    mutationFn: (value: string) => costClosingApi.close({ month: value }),
    onSuccess: (result) => {
      setLastResult(result);
      toast.success('Fechamento concluído');
      qc.invalidateQueries({ queryKey: ['cost-closings'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(`Falha no fechamento: ${getFriendlyError(err)}`),
  });

  const closings: CostClosingRecord[] = history.data ?? [];

  return (
    <div className="flex flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fechar mês</CardTitle>
          <CardDescription>
            Distribui os custos fixos do mês (contador, aluguel, assinaturas…) entre os pedidos daquele mês, para o lucro de cada pedido refletir o custo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {admin ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="sm:max-w-[240px]" aria-label="Mês a fechar">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => closeMutation.mutate(month)} disabled={closeMutation.isPending}>
                {closeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
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
            Fechar de novo o mesmo mês recalcula e substitui o fechamento anterior (útil depois de lançar um custo esquecido).
          </p>
        </CardContent>
      </Card>

      {lastResult ? (
        <Card>
          <CardHeader>
            <CardTitle>{periodLabel(lastResult.period.start, lastResult.period.end)}</CardTitle>
            <CardDescription>Resultado do fechamento que você acabou de fazer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[['Pedidos', lastResult.orders], ['Produtos vendidos', lastResult.products], ['Rateios gerados', lastResult.allocations]].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Custos mensais considerados</h4>
              {lastResult.components.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum custo mensal ativo no período. Cadastre-os na aba Componentes com o tipo mensal.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Como é dividido</TableHead>
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
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Fechamentos feitos</CardTitle>
          <CardDescription>Meses já fechados e quanto de custo fixo foi distribuído em cada um.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : closings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <CalendarRange className="mb-3 h-10 w-10" />
              <p className="font-medium">Nenhum mês fechado ainda</p>
              <p className="text-sm">Escolha um mês acima e clique em "Fechar mês".</p>
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Custo distribuído</TableHead>
                    <TableHead>Fechado em</TableHead>
                    {admin ? <TableHead className="w-[1%]"><span className="sr-only">Ações</span></TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closings.map((c) => {
                    const isMonth = /^\d{4}-\d{2}-01$/.test(c.period_start);
                    return (
                      <TableRow key={`${c.period_start}-${c.period_end}`}>
                        <TableCell className="font-medium">{periodLabel(c.period_start, c.period_end)}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(c.total_allocated)}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(c.closed_at)}</TableCell>
                        {admin ? (
                          <TableCell>
                            {isMonth ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={closeMutation.isPending}
                                onClick={() => closeMutation.mutate(c.period_start.slice(0, 7))}
                                title="Recalcular este mês"
                              >
                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                Recalcular
                              </Button>
                            ) : null}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
