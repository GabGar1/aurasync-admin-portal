import { describe, it, expect } from 'vitest';
import { costComponentSchema } from './schemas';

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
