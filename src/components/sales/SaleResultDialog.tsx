import { BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, marginPercent, sourceLabel, statusLabel } from '@/lib/formatters';
import type { ExternalSaleResult } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: ExternalSaleResult | null;
}

export default function SaleResultDialog({ open, onOpenChange, sale }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-green-600" />
            Venda registrada
          </DialogTitle>
        </DialogHeader>
        {sale ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedido</span>
              <span className="font-mono text-xs pt-0.5">#{sale.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={sale.status === 'CANCELED' ? 'destructive' : 'default'}>
                {statusLabel(sale.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Origem</span>
              <span>{sourceLabel(sale.source)}</span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total da venda</span>
                <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo total</span>
                <span>{formatCurrency(sale.total_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lucro total</span>
                <span className="font-semibold text-green-700">{formatCurrency(sale.total_profit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem</span>
                <span className="font-semibold">{marginPercent(sale.margin_percent)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
