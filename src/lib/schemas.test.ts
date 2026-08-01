import { describe, it, expect } from 'vitest';
import { costComponentSchema, externalSaleSchema } from './schemas';

describe('costComponentSchema', () => {
  it('aceita componente válido', () => {
    const result = costComponentSchema.safeParse({
      name: 'Embalagem premium',
      type: 'FIXED',
      category: 'PACKAGING',
      value: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita sem nome', () => {
    const result = costComponentSchema.safeParse({ name: '', type: 'FIXED', value: 1 });
    expect(result.success).toBe(false);
  });

  it('exige base de cálculo para PERCENT', () => {
    const withoutBase = costComponentSchema.safeParse({ name: 'Taxa', type: 'PERCENT', value: 5 });
    expect(withoutBase.success).toBe(false);
    const withBase = costComponentSchema.safeParse({ name: 'Taxa', type: 'PERCENT', value: 5, calculation_base: 'PRICE' });
    expect(withBase.success).toBe(true);
  });

  it('rejeita valor negativo', () => {
    const result = costComponentSchema.safeParse({ name: 'X', type: 'FIXED', value: -1 });
    expect(result.success).toBe(false);
  });

  it('aceita FIXED sem base de cálculo', () => {
    const result = costComponentSchema.safeParse({ name: 'X', type: 'FIXED', value: 1 });
    expect(result.success).toBe(true);
  });
});

describe('externalSaleSchema', () => {
  it('aceita venda válida', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: 'João',
      items: [{ variant_id: 'uuid-a', quantity: 2, unit_price: 10 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejeita sem nome do cliente', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: '',
      items: [{ variant_id: 'uuid-a', quantity: 1, unit_price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejeita sem itens', () => {
    const result = externalSaleSchema.safeParse({ customer_name: 'João', items: [] });
    expect(result.success).toBe(false);
  });

  it('rejeita item sem variante', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: 'João',
      items: [{ quantity: 1, unit_price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejeita email inválido', () => {
    const result = externalSaleSchema.safeParse({
      customer_name: 'João',
      customer_email: 'invalido',
      items: [{ variant_id: 'uuid-a', quantity: 1, unit_price: 10 }],
    });
    expect(result.success).toBe(false);
  });
});
