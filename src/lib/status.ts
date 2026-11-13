import { effectiveOrderStatus, inventoryTypeLabel, roleLabel, type OrderStatusLike } from '@/lib/formatters';

/** Semantic tones: green/amber/red only carry meaning; "brand" is the lilac accent. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

export interface StatusBadgeData {
  tone: StatusTone;
  label: string;
}

const orderToneByKey: Record<string, StatusTone> = {
  cancelled: 'danger',
  canceled: 'danger',
  voided: 'danger',
  refunded: 'danger',
  delivered: 'success',
  closed: 'success',
  marked_as_fulfilled: 'success',
  shipped: 'brand',
  dispatched: 'brand',
  paid: 'info',
};

/** One rule for the order status shown in every screen (list, detail, customer history). */
export function orderStatusBadge(order: OrderStatusLike): StatusBadgeData {
  const { key, label } = effectiveOrderStatus(order);
  return { tone: orderToneByKey[key.toLowerCase()] ?? 'warning', label };
}

export function activeBadge(active: boolean): StatusBadgeData {
  return active ? { tone: 'success', label: 'Ativo' } : { tone: 'neutral', label: 'Inativo' };
}

const roleTone: Record<string, StatusTone> = { SUPER_ADMIN: 'brand', ADMIN: 'info', EMPLOYEE: 'neutral' };

export function roleBadge(role: string): StatusBadgeData {
  return { tone: roleTone[role] ?? 'neutral', label: roleLabel(role) };
}

const inventoryTone: Record<string, StatusTone> = { SALE: 'info', RESTOCK: 'success', ADJUSTMENT: 'warning' };

export function inventoryTypeBadge(type: string): StatusBadgeData {
  return { tone: inventoryTone[type] ?? 'neutral', label: inventoryTypeLabel(type) };
}

const paymentStatus: Record<string, StatusBadgeData> = {
  paid: { tone: 'success', label: 'Pago' },
  authorized: { tone: 'info', label: 'Autorizado' },
  pending: { tone: 'warning', label: 'Pagamento pendente' },
  partially_paid: { tone: 'warning', label: 'Pago parcialmente' },
  abandoned: { tone: 'neutral', label: 'Abandonado' },
  refunded: { tone: 'danger', label: 'Reembolsado' },
  partially_refunded: { tone: 'warning', label: 'Reembolso parcial' },
  voided: { tone: 'danger', label: 'Estornado' },
};

export function paymentStatusBadge(status: string | null | undefined): StatusBadgeData | null {
  if (!status) return null;
  return paymentStatus[status.toLowerCase()] ?? { tone: 'neutral', label: status };
}
