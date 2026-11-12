import { describe, it, expect } from 'vitest';
import { totalStock, sortProductsByStock, stockLevel } from './stock';
import type { Product, ProductVariant } from '@/types';

const vars = (qs: (number | null)[]): ProductVariant[] =>
  qs.map((q, i) => ({ id: `v${i}`, stock_quantity: q ?? 0 } as unknown as ProductVariant));

describe('totalStock', () => {
  it('soma as quantidades das variantes', () => {
    expect(totalStock(vars([1, 2, 3]))).toBe(6);
  });
  it('trata arrays vazios, null e undefined', () => {
    expect(totalStock([])).toBe(0);
    expect(totalStock(null)).toBe(0);
    expect(totalStock(undefined)).toBe(0);
  });
});

describe('stockLevel', () => {
  it('classifica o estoque, incluindo venda além do estoque (negativo)', () => {
    expect(stockLevel(11)).toBe('ok');
    expect(stockLevel(10)).toBe('low');
    expect(stockLevel(5)).toBe('low');
    expect(stockLevel(4)).toBe('restock');
    expect(stockLevel(0)).toBe('restock');
    expect(stockLevel(-1)).toBe('oversold');
  });
});

describe('sortProductsByStock', () => {
  const products = [
    { id: 'p1', name: 'Alfa', is_active: true, variants: vars([10]) },
    { id: 'p2', name: 'Beta', is_active: true, variants: vars([0]) },
    { id: 'p3', name: 'Gama', is_active: false, variants: vars([5]) },
    { id: 'p4', name: 'Delta', is_active: true, variants: null },
  ] as unknown as Product[];

  it('ordena crescente por estoque', () => {
    expect(sortProductsByStock(products, 'asc').map((p) => p.id)).toEqual(['p2', 'p4', 'p3', 'p1']);
  });

  it('ordena decrescente por estoque', () => {
    expect(sortProductsByStock(products, 'desc').map((p) => p.id)).toEqual(['p1', 'p3', 'p2', 'p4']);
  });

  it('não muta o array original', () => {
    const copy = [...products];
    sortProductsByStock(products, 'asc');
    expect(products).toEqual(copy);
  });
});