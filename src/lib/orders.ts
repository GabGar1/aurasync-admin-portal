import type { Order } from '@/types';

/**
 * Orders imported from Nuvemshop are owned by Nuvemshop: their status changes there and
 * arrives here through the webhook/sync (the API refuses local changes with 409).
 */
export function isEditableLocally(order: Pick<Order, 'nuvemshop_order_id'>): boolean {
  return !order.nuvemshop_order_id;
}
