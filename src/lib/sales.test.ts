import { describe, it, expect } from 'vitest';
import { toExternalSalePayload, isPreviewable } from './sales';
import type { ExternalSaleFormValues } from '@/lib/schemas';

const base = {
  customer_name: '  Maria  ',
  customer_email: '',
  items: [{ variant_id: 'v1', quantity: '2', unit_price: '80' }],
  discount_amount: '10',
  payment_method: '',
  gateway: ' ',
  payment_installments: undefined,
  shipping_cost_owner: undefined,
  shipping_cost_customer: undefined,
  is_fair: false,
  status: 'PAID',
} as unknown as ExternalSaleFormValues;

describe('toExternalSalePayload', () => {
  it('converte os campos do formulário (texto) para o que a API espera', () => {
    expect(toExternalSalePayload(base)).toEqual({
      customer_name: 'Maria',
      customer_email: undefined,
      items: [{ variant_id: 'v1', quantity: 2, unit_price: 80 }],
      discount_amount: 10,
      payment_method: undefined,
      gateway: undefined,
      payment_installments: undefined,
      shipping_cost_owner: undefined,
      shipping_cost_customer: undefined,
      is_fair: false,
      status: 'PAID',
    });
  });

  it('trata campos numéricos vazios como não informados', () => {
    const payload = toExternalSalePayload({ ...base, discount_amount: '' as unknown as number });
    expect(payload.discount_amount).toBeUndefined();
  });
});

describe('isPreviewable', () => {
  it('só pede a prévia quando todos os itens têm produto e quantidade', () => {
    expect(isPreviewable(toExternalSalePayload(base))).toBe(true);
    expect(isPreviewable(toExternalSalePayload({ ...base, items: [{ variant_id: '', quantity: 1, unit_price: 0 }] }))).toBe(false);
    expect(isPreviewable(toExternalSalePayload({ ...base, items: [{ variant_id: 'v1', quantity: 0, unit_price: 10 }] }))).toBe(false);
  });
});
