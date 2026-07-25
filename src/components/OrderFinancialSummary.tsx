import type { OrderItem } from "@/types";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

interface Props {
  items: OrderItem[];
  total_amount: number;
  discount_amount?: number | null;
  shipping_cost_customer?: number | null;
  payment_method?: string | null;
  payment_installments?: number | null;
}

export default function OrderFinancialSummary({
  items, total_amount, discount_amount, shipping_cost_customer,
  payment_method, payment_installments,
}: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {discount_amount && discount_amount > 0 ? (
        <div className="flex justify-between text-red-500">
          <span>Desconto</span>
          <span>-{formatCurrency(discount_amount)}</span>
        </div>
      ) : null}
      {shipping_cost_customer && shipping_cost_customer > 0 ? (
        <div className="flex justify-between text-green-600">
          <span>Frete</span>
          <span>{formatCurrency(shipping_cost_customer)}</span>
        </div>
      ) : null}
      <div className="flex justify-between font-bold text-base pt-1 border-t">
        <span>Total</span>
        <span>{formatCurrency(total_amount)}</span>
      </div>
      {payment_method ? (
        <div className="flex justify-between pt-1 text-xs text-muted-foreground">
          <span>Pagamento</span>
          <span>{paymentMethodLabel(payment_method)}{payment_installments ? ` (${payment_installments}x)` : ''}</span>
        </div>
      ) : null}
    </div>
  );
}
