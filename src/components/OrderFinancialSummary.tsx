import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "@/types";
import { formatCurrency, marginPercent } from "@/lib/formatters";

interface Props {
  order: Order;
}

export default function OrderFinancialSummary({ order }: Props) {
  const [showMonthly, setShowMonthly] = useState(false);

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
        <span className="text-muted-foreground">Custo da venda</span>
        <span>{order.total_cost === null || order.total_cost === undefined ? '-' : formatCurrency(order.total_cost)}</span>
      </div>
      <div>
        <button
          type="button"
          className="w-full flex items-center justify-between text-muted-foreground"
          onClick={() => setShowMonthly((v) => !v)}
          disabled={!order.monthly_allocations?.length}
        >
          <span>Custos mensais rateados</span>
          <span className="flex items-center gap-1">
            {order.monthly_cost_total !== undefined ? formatCurrency(order.monthly_cost_total) : '-'}
            {order.monthly_allocations?.length ? (showMonthly ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
          </span>
        </button>
        {showMonthly && order.monthly_allocations?.length ? (
          <div className="mt-2 space-y-1 pl-3 border-l">
            {order.monthly_allocations.map((alloc) => (
              <div key={alloc.id} className="flex justify-between text-xs">
                <span>{alloc.cost_component_name ?? alloc.cost_component_id.slice(0, 8)}</span>
                <span>{formatCurrency(Number(alloc.amount))}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex justify-between font-medium">
        <span>Custo total (venda + mensal)</span>
        <span>{order.total_cost_with_monthly !== undefined ? formatCurrency(order.total_cost_with_monthly) : '-'}</span>
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
