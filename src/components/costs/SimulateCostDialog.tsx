import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { costComponentsApi } from '@/services/api';
import { formatCurrency, marginPercent } from '@/lib/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import VariantPicker, { type PickedVariant } from '@/components/VariantPicker';
import type { CostSimulateResponse, ApiError } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SimulateCostDialog({ open, onOpenChange }: Props) {
  const [variant, setVariant] = useState<PickedVariant | null>(null);
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  const simulateMutation = useMutation({
    mutationFn: () => costComponentsApi.simulate({
      variant_id: variant!.variant_id,
      unit_price: parseFloat(unitPrice) || 0,
      quantity: parseInt(quantity) || 1,
    }),
    onError: (err: ApiError) => toast.error(`Falha ao simular: ${err?.response?.data?.error || err?.message}`),
  });

  useEffect(() => {
    if (!open) {
      setVariant(null);
      setUnitPrice('');
      setQuantity('1');
      simulateMutation.reset();
    }
  }, [open, simulateMutation]);

  const result: CostSimulateResponse | undefined = simulateMutation.data;

  function handleVariantSelect(picked: PickedVariant) {
    setVariant(picked);
    setUnitPrice(String(picked.price));
    setQuantity('1');
    simulateMutation.reset();
  }

  const breakdownRows = result
    ? [
        { label: 'Custo do produto', value: result.unit_cost },
        { label: 'Embalagem', value: result.unit_packaging_cost },
        { label: 'Taxa da plataforma', value: result.unit_platform_fee },
        { label: 'Impostos', value: result.unit_tax },
        { label: 'Frete', value: result.unit_shipping_cost },
        { label: 'Operacional', value: result.unit_operational_cost },
        { label: 'Marketing', value: result.unit_marketing_cost },
        { label: 'Outros', value: result.unit_other_cost },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Simular Custo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Produto / Variante</Label>
            <VariantPicker value={variant} onSelect={handleVariantSelect} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sim-unit-price">Preço de venda (R$)</Label>
              <Input
                id="sim-unit-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => { setUnitPrice(e.target.value); simulateMutation.reset(); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-quantity">Quantidade</Label>
              <Input
                id="sim-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); simulateMutation.reset(); }}
              />
            </div>
          </div>
          <Button
            disabled={!variant || !unitPrice || simulateMutation.isPending}
            onClick={() => simulateMutation.mutate()}
          >
            {simulateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
            Simular
          </Button>

          {result ? (
            <div className="space-y-3 border rounded-lg p-4">
              <h4 className="text-sm font-semibold">Resultado por unidade</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdownRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Custo total</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(result.unit_total_cost)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Lucro unitário</TableCell>
                    <TableCell className="text-right font-semibold text-green-700">{formatCurrency(result.unit_profit)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Margem</TableCell>
                    <TableCell className="text-right font-semibold">{marginPercent(result.margin_percent)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {result.cost_breakdown.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Detalhamento por componente</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Componente</TableHead>
                        <TableHead className="text-right">Tipo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.cost_breakdown.map((item) => (
                        <TableRow key={item.component_id ?? item.name}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{item.type}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.line_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
