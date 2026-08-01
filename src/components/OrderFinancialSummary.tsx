import type { Order } from "@/types";
import { formatCurrency, marginPercent } from "@/lib/formatters";

interface Props {
  order: Order;
}

export default function OrderFinancialSummary({ order }: Props) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total da venda</span>
        <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
      </div>
      {order.discount_amount && order.discount_amount > 0 ? (
        <div className="flex justify-between text-red-500">
          <span>Desconto</span>
          <span>-{formatCurrency(order.discount_amount)}</span>
        </div>
      ) : null}
      <div className="flex justify-between">
        <span className="text-muted-foreground">Custo total</span>
        <span>{order.total_cost === null || order.total_cost === undefined ? '-' : formatCurrency(order.total_cost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Lucro total</span>
        <span className="font-semibold text-green-700">
          {order.total_profit === null || order.total_profit === undefined ? '-' : formatCurrency(order.total_profit)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Margem</span>
        <span className="font-semibold">{marginPercent(order.margin_percent)}</span>
      </div>
    </div>
  );
}
