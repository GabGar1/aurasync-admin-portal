import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, Info, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { creditFeeTiersApi, getFriendlyError } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { CreditFeeTier } from '@/types';

export default function CreditFeeTab() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const [editingTier, setEditingTier] = useState<CreditFeeTier | null>(null);
  const [percent, setPercent] = useState('');
  const [fixedFee, setFixedFee] = useState('');
  const [isActive, setIsActive] = useState(true);

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
      setEditingTier(null);
      invalidate();
    },
    onError: (err) => toast.error(`Falha ao atualizar: ${getFriendlyError(err)}`),
  });

  function handleSave() {
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
      <Alert variant="default" className="border-muted">
        <Info className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Alterações valem para novas vendas. Pedidos anteriores permanecem com os valores congelados da época.
        </AlertDescription>
      </Alert>

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
            <p className="text-lg font-medium">Nenhuma faixa de crédito encontrada</p>
            <p className="text-sm">As faixas de parcelamento são configuradas no backend.</p>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Parcelas</TableHead>
                <TableHead className="w-[25%]">Percentual</TableHead>
                <TableHead className="w-[25%]">Taxa fixa</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
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
                  <TableCell>{Number(tier.percent).toFixed(2)}%</TableCell>
                  <TableCell>{formatCurrency(Number(tier.fixed_fee))}</TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'} className={tier.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 border-transparent' : ''}>
                      {tier.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
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

      <Dialog open={editingTier !== null} onOpenChange={(open) => { if (!open) setEditingTier(null); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              Editar Faixa {editingTier?.installments === 1 ? '1x (à vista)' : `${editingTier?.installments}x`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="tier-active">Ativo</Label>
                <p className="text-xs text-muted-foreground">Faixa participa da cobrança em novas vendas</p>
              </div>
              <Switch id="tier-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingTier(null)}>Cancelar</Button>
              <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
