import type { Product } from '@/types';

export function totalStock(variants: Array<{ stock_quantity: number }> | null | undefined): number {
  return variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0;
}

export function sortProductsByStock(products: Product[], direction: 'asc' | 'desc'): Product[] {
  return [...products].sort((a, b) => {
    const diff = totalStock(a.variants) - totalStock(b.variants);
    if (diff !== 0) return direction === 'asc' ? diff : -diff;
    const activeDiff = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    if (activeDiff !== 0) return activeDiff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}