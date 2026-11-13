import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, marginPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ExternalSalePreview } from '@/types';

interface SaleSummaryProps {
  preview?: ExternalSalePreview;
  ready: boolean;
  loading: boolean;
  error?: string | null;
  /** The submit button, rendered at the bottom of the card. */
  action: ReactNode;
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 text-sm', strong && 'text-base font-semibold', className)}>
      <span className={strong ? undefined : 'text-muted-foreground'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** Live summary: what the sale totals, costs and earns before it is registered. */
export function SaleSummary({ preview, ready, loading, error, action }: SaleSummaryProps) {
  return (
    <Card className="lg:sticky lg:top-20">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Resumo da venda</CardTitle>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Calculando" /> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!ready ? (
          <p className="text-sm text-muted-foreground">Escolha os produtos para ver o total, o custo e a margem.</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : preview ? (
          <>
            <Row label="Subtotal" value={formatCurrency(preview.subtotal)} />
            {preview.discount_amount > 0 ? <Row label="Desconto" value={`− ${formatCurrency(preview.discount_amount)}`} /> : null}
            <Row label="Total" value={formatCurrency(preview.total_amount)} strong />
            <Separator />
            <Row label="Custo estimado" value={formatCurrency(preview.total_cost)} />
            <Row
              label="Lucro"
              value={formatCurrency(preview.total_profit)}
              className={preview.total_profit < 0 ? 'text-destructive' : 'text-success'}
            />
            <Row label="Margem" value={marginPercent(preview.margin_percent)} />
            <p className="text-xs text-muted-foreground">
              Custo de produto, embalagem, taxas e frete pela mesma regra usada ao registrar. Custos mensais entram no fechamento do mês.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Calculando…</p>
        )}
        <div className="pt-2">{action}</div>
      </CardContent>
    </Card>
  );
}
