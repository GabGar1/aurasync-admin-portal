import type { Order } from '@/types';

/**
 * Orders imported from Nuvemshop are owned by Nuvemshop: their status changes there and
 * arrives here through the webhook/sync (the API refuses local changes with 409).
 */
/** How an order is called on screen: the Nuvemshop number (#1043) or the start of the internal id. */
export function orderDisplayId(order: Pick<Order, 'id' | 'nuvemshop_order_number'>): string {
  return order.nuvemshop_order_number ? `#${order.nuvemshop_order_number}` : `#${order.id.slice(0, 8)}`;
}

export function isEditableLocally(order: Pick<Order, 'nuvemshop_order_id'>): boolean {
  return !order.nuvemshop_order_id;
}
