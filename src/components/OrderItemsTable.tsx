import { useState } from "react";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { OrderItem } from "@/types";
import { formatCurrency, marginPercent, typeLabel } from "@/lib/formatters";

interface Props {
  items: OrderItem[];
}

async function copyVariantId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    toast.success('ID da variante copiado');
  } catch {
    toast.error('Falha ao copiar');
  }
}

export default function OrderItemsTable({ items }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item neste pedido</p>;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10px]" />
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Preço Unit.</TableHead>
            <TableHead className="text-right">Custo Unit.</TableHead>
            <TableHead className="text-right">Lucro Unit.</TableHead>
            <TableHead className="text-right">Margem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="align-top">
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  disabled={!item.cost_breakdown || item.cost_breakdown.length === 0}
                >
                  {expanded === item.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.product_name ?? '-'}</p>
                    {item.variant_name ? (
                      <p className="truncate text-xs text-muted-foreground">{item.variant_name}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    title="Copiar ID da variante"
                    onClick={() => copyVariantId(item.variant_id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unit_total_cost)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unit_profit)}</TableCell>
              <TableCell className="text-right">{marginPercent(item.margin_percent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {expanded && items.find((item) => item.id === expanded)?.cost_breakdown ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.find((item) => item.id === expanded)?.cost_breakdown?.map((breakdown) => (
                <TableRow key={breakdown.component_id ?? breakdown.name}>
                  <TableCell className="font-medium">{breakdown.name}</TableCell>
                  <TableCell>{typeLabel(breakdown.type)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(breakdown.unit_value)}</TableCell>
                  <TableCell className="text-right">{breakdown.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(breakdown.line_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
