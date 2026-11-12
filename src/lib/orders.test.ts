import { describe, it, expect } from 'vitest';
import { isEditableLocally } from './orders';

describe('isEditableLocally', () => {
  it('permite alterar pedidos criados no AuraSync (manuais e vendas externas)', () => {
    expect(isEditableLocally({ nuvemshop_order_id: null })).toBe(true);
  });

  it('bloqueia pedidos da Nuvemshop, que são alterados na própria Nuvemshop', () => {
    expect(isEditableLocally({ nuvemshop_order_id: '12345' })).toBe(false);
  });
});
