import type { ExternalSaleFormValues } from '@/lib/schemas';
import type { ExternalSalePayload } from '@/types';

/** Inputs come back as text from the form; empty means "not informed". */
const optionalNumber = (value: unknown): number | undefined =>
  value === undefined || value === null || value === '' ? undefined : Number(value);

const optionalText = (value: string | undefined | null): string | undefined => (value?.trim() ? value.trim() : undefined);

/** Single conversion used both to register the sale and to preview it. */
export function toExternalSalePayload(values: ExternalSaleFormValues): ExternalSalePayload {
  return {
    customer_name: values.customer_name.trim(),
    customer_email: optionalText(values.customer_email),
    items: values.items.map((item) => ({
      variant_id: item.variant_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
    discount_amount: optionalNumber(values.discount_amount),
    payment_method: values.payment_method || undefined,
    gateway: optionalText(values.gateway),
    payment_installments: optionalNumber(values.payment_installments),
    shipping_cost_owner: optionalNumber(values.shipping_cost_owner),
    shipping_cost_customer: optionalNumber(values.shipping_cost_customer),
    is_fair: values.is_fair ?? false,
    status: values.status,
  };
}

/** The preview needs every item to have a product and a positive quantity. */
export function isPreviewable(payload: ExternalSalePayload): boolean {
  return payload.items.length > 0 && payload.items.every((i) => i.variant_id && i.quantity > 0 && i.unit_price >= 0);
}
