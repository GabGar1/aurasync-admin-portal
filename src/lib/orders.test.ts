import { describe, it, expect } from 'vitest';
import { isEditableLocally, orderDisplayId } from './orders';

describe('orderDisplayId', () => {
  it('mostra o número que o lojista conhece na Nuvemshop', () => {
    expect(orderDisplayId({ id: '5c70a629-aaaa', nuvemshop_order_number: '1043' })).toBe('#1043');
  });

  it('usa o início do id interno para vendas do AuraSync', () => {
    expect(orderDisplayId({ id: '5c70a629-aaaa', nuvemshop_order_number: null })).toBe('#5c70a629');
  });
});

describe('isEditableLocally', () => {
  it('permite alterar pedidos criados no AuraSync (manuais e vendas externas)', () => {
    expect(isEditableLocally({ nuvemshop_order_id: null })).toBe(true);
  });

  it('bloqueia pedidos da Nuvemshop, que são alterados na própria Nuvemshop', () => {
    expect(isEditableLocally({ nuvemshop_order_id: '12345' })).toBe(false);
  });
});
