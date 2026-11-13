import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, Info, Loader2, Pencil, Plus } from 'lucide-react';
import { activeBadge } from '@/lib/status';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { creditFeeTiersApi, getFriendlyError } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CreditFeeTier, CreditFeeTierCreate } from '@/types';

export default function CreditFeeTab() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const [editingTier, setEditingTier] = useState<CreditFeeTier | null>(null);
  const [creating, setCreating] = useState(false);
  const [installments, setInstallments] = useState('');
  const [percent, setPercent] = useState('');
  const [fixedFee, setFixedFee] = useState('');
  const [isActive, setIsActive] = useState(true);
  const dialogOpen = editingTier !== null || creating;

  function closeDialog() {
    setEditingTier(null);
    setCreating(false);
  }

  function openCreate() {
    const used = new Set((tiers ?? []).map((t) => t.installments));
    const next = Array.from({ length: 24 }, (_, i) => i + 1).find((n) => !used.has(n)) ?? 1;
    setInstallments(String(next));
    setPercent('');
    setFixedFee('0');
    setIsActive(true);
    setCreating(true);
  }

  const { data: tiers, isLoading, isError, refetch } = useQuery({
    queryKey: ['credit-fee-tiers'],
    queryFn: creditFeeTiersApi.list,
  });

  useEffect(() => {
    if (editingTier) {
      setPercent(String(editingTier.percent));
      setFixedFee(String(editingTier.fixed_fee));
      setIsActive(editingTier.is_active);
    }
  }, [editingTier]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['credit-fee-tiers'] });
  }, [qc]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { percent: number; fixed_fee: number; is_active: boolean } }) =>
      creditFeeTiersApi.update(id, payload),
    onSuccess: () => {
      toast.success('Faixa de crédito atualizada');
      closeDialog();
      invalidate();
    },
    onError: (err) => toast.error(`Falha ao atualizar: ${getFriendlyError(err)}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreditFeeTierCreate) => creditFeeTiersApi.create(payload),
    onSuccess: () => {
      toast.success('Faixa de crédito criada');
      closeDialog();
      invalidate();
    },
    onError: (err) => toast.error(`Falha ao criar: ${getFriendlyError(err)}`),
  });

  function handleSave() {
    if (creating) {
      createMutation.mutate({ installments: Number(installments), percent: Number(percent), fixed_fee: Number(fixedFee || 0) });
      return;
    }
    if (!editingTier) return;
    updateMutation.mutate({
      id: editingTier.id,
      payload: {
        percent: Number(percent),
        fixed_fee: Number(fixedFee),
        is_active: isActive,
      },
    });
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Alert variant="default" className="border-muted sm:max-w-2xl">
          <Info className="h-4 w-4" />
          <AlertTitle>Taxa da maquininha ou do intermediador por número de parcelas</AlertTitle>
          <AlertDescription>
            Entra no custo de cada venda conforme as parcelas. Alterações valem para novas vendas; pedidos anteriores mantêm os valores da época.
          </AlertDescription>
        </Alert>
        {admin ? (
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Nova faixa
          </Button>
        ) : null}
      </div>

      <div>
        {isError ? (
          <div className="flex items-center justify-center py-16">
            <Alert variant="destructive" className="w-full max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar faixas de crédito</AlertTitle>
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
        ) : (tiers ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CreditCard className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhuma faixa cadastrada</p>
            <p className="text-sm">Sem faixas, as vendas parceladas saem sem a taxa de crédito no custo.</p>
            {admin ? (
              <Button onClick={openCreate} className="mt-4">
                <Plus className="mr-1 h-4 w-4" />
                Cadastrar primeira faixa
              </Button>
            ) : null}
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Parcelas</TableHead>
                <TableHead className="w-[25%]">Percentual</TableHead>
                <TableHead className="w-[25%]">Taxa fixa</TableHead>
                <TableHead className="w-[15%]">Situação</TableHead>
                <TableHead className="w-[10%] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tiers ?? []).map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <span className="font-medium truncate block">
                      {tier.installments === 1 ? '1x (à vista)' : `${tier.installments}x`}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{Number(tier.percent).toFixed(2).replace('.', ',')}%</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(Number(tier.fixed_fee))}</TableCell>
                  <TableCell><StatusBadge {...activeBadge(tier.is_active)} dot /></TableCell>
                  <TableCell className="text-center">
                    {admin ? (
                      <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setEditingTier(tier)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {creating ? 'Nova faixa' : `Editar faixa ${editingTier?.installments === 1 ? '1x (à vista)' : `${editingTier?.installments}x`}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {creating ? (
              <div className="space-y-2">
                <Label htmlFor="tier-installments">Parcelas</Label>
                <Input
                  id="tier-installments"
                  type="number"
                  min="1"
                  max="24"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="tier-percent">Percentual (%)</Label>
              <Input
                id="tier-percent"
                type="number"
                step="0.01"
                min="0"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier-fixed-fee">Taxa fixa (R$)</Label>
              <Input
                id="tier-fixed-fee"
                type="number"
                step="0.01"
                min="0"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
              />
            </div>
            {!creating ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="tier-active">Ativo</Label>
                  <p className="text-xs text-muted-foreground">Faixa entra no custo das novas vendas</p>
                </div>
                <Switch id="tier-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            ) : null}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending || createMutation.isPending || percent === '' || (creating && !installments)}
              >
                {updateMutation.isPending || createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
