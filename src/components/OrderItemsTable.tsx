import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { OrderItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  items: OrderItem[];
}

export default function OrderItemsTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item neste pedido</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Variante</TableHead>
          <TableHead className="text-right">Qtd</TableHead>
          <TableHead className="text-right">Preço Unit.</TableHead>
          <TableHead className="text-right">Custo Unit.</TableHead>
          <TableHead className="text-right">Subtotal</TableHead>
          <TableHead className="w-[80px] text-center">Promo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-xs">{item.variant_id}</TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</TableCell>
            <TableCell className="text-center">
              {item.has_promotional_price ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  Promo
                </Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
