import type { Product } from '@/types';

export function totalStock(variants: Array<{ stock_quantity: number }> | null | undefined): number {
  return variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0;
}

/** Secondary line of a product row: its SKU when there is one variant, otherwise how many. */
export function variantSummary(variants: Array<{ sku?: string | null }> | null | undefined): string {
  const count = variants?.length ?? 0;
  if (count === 0) return 'Sem variações';
  if (count === 1) return variants![0]!.sku ? `SKU ${variants![0]!.sku}` : '1 variação';
  return `${count} variações`;
}

export type StockLevel = 'ok' | 'low' | 'restock' | 'oversold';

/** Negative stock means Nuvemshop sold more than AuraSync had registered. */
export function stockLevel(quantity: number): StockLevel {
  if (quantity < 0) return 'oversold';
  if (quantity > 10) return 'ok';
  if (quantity >= 5) return 'low';
  return 'restock';
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
