import { describe, it, expect } from 'vitest';
import { costComponentSchema, productSubgroupSchema, externalSaleSchema, storedUserSchema } from './schemas';

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

  it('aceita componente PACKAGING com capacidade', () => {
    const result = costComponentSchema.safeParse({
      name: 'Caixa', type: 'PACKAGING', category: 'PACKAGING',
      value: 5, max_products_per_package: 6, consolidates: true,
    });
    expect(result.success).toBe(true);
  });

  it('trata capacidade vazia como ausente', () => {
    const nonPackaging = costComponentSchema.safeParse({ name: 'Fixo', type: 'FIXED', value: 10, max_products_per_package: '' });
    expect(nonPackaging.success).toBe(true);
    const packaging = costComponentSchema.safeParse({ name: 'Caixa', type: 'PACKAGING', value: 5, max_products_per_package: '' });
    expect(packaging.success).toBe(false);
  });

  it('exige capacidade para PACKAGING', () => {
    const result = costComponentSchema.safeParse({ name: 'Caixa', type: 'PACKAGING', value: 5 });
    expect(result.success).toBe(false);
  });

  it('exige base de rateio para MONTHLY_FIXED', () => {
    const without = costComponentSchema.safeParse({ name: 'Equipe', type: 'MONTHLY_FIXED', value: 500 });
    expect(without.success).toBe(false);
    const withBasis = costComponentSchema.safeParse({ name: 'Equipe', type: 'MONTHLY_FIXED', value: 500, allocation_basis: 'PER_ORDER' });
    expect(withBasis.success).toBe(true);
  });

  it('valida período como AAAA-MM-DD', () => {
    const bad = costComponentSchema.safeParse({ name: 'Tráfego', type: 'FIXED', value: 10, period_start: '01-08-2026' });
    expect(bad.success).toBe(false);
    const good = costComponentSchema.safeParse({ name: 'Tráfego', type: 'FIXED', value: 10, period_start: '2026-08-01', period_end: '2026-08-31' });
    expect(good.success).toBe(true);
  });

  it('rejeita tipo antigo MONTHLY', () => {
    const result = costComponentSchema.safeParse({ name: 'Antigo', type: 'MONTHLY', value: 1 });
    expect(result.success).toBe(false);
  });

  it('valida subgrupo', () => {
    expect(productSubgroupSchema.safeParse({ name: 'Anéis' }).success).toBe(true);
    expect(productSubgroupSchema.safeParse({ name: '' }).success).toBe(false);
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

describe('storedUserSchema', () => {
  it('aceita o payload real do backend /auth/me (status boolean)', () => {
    const result = storedUserSchema.safeParse({
      id: 'a96175ef-de55-46ea-a55b-f2731cc491e9',
      email: 'admin@aurasync.com',
      first_name: 'Super',
      last_name: 'Admin',
      role: 'SUPER_ADMIN',
      status: true,
      created_at: '2026-07-25T22:41:39.077Z',
    });
    expect(result.success).toBe(true);
  });

  it('aceita status false', () => {
    const result = storedUserSchema.safeParse({
      id: 'a',
      email: 'u@example.com',
      first_name: 'A',
      last_name: 'B',
      role: 'EMPLOYEE',
      status: false,
      created_at: '2026-07-25T22:41:39.077Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita role inválida', () => {
    const result = storedUserSchema.safeParse({
      id: 'a',
      email: 'u@example.com',
      first_name: 'A',
      last_name: 'B',
      role: 'OWNER',
      status: true,
      created_at: '2026-07-25T22:41:39.077Z',
    });
    expect(result.success).toBe(false);
  });
});
