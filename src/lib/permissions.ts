/**
 * Single source of truth for what each role can see and do in the panel.
 * It mirrors the API guards (requireRole on the backend); the API still enforces them,
 * this only keeps the UI from offering what would be refused.
 */
export type Permission =
  | 'dashboard.view'
  | 'orders.view'
  | 'products.view'
  | 'products.sync'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'costs.manage'
  | 'sales.create'
  | 'customers.view'
  | 'users.manage'
  | 'users.changeRole';

const ANY = ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'] as const;
const ADMINS = ['ADMIN', 'SUPER_ADMIN'] as const;

const RULES: Record<Permission, readonly string[]> = {
  'dashboard.view': ADMINS,
  'orders.view': ADMINS,
  'products.view': ANY,
  'products.sync': ADMINS,
  'inventory.view': ANY,
  'inventory.adjust': ADMINS,
  'costs.manage': ADMINS,
  'sales.create': ADMINS,
  'customers.view': ADMINS,
  'users.manage': ADMINS,
  'users.changeRole': ['SUPER_ADMIN'],
};

export function can(role: string | null | undefined, permission: Permission): boolean {
  return !!role && RULES[permission].includes(role);
}

/** Landing page after login or when a page is not allowed for the role. */
export function homePathFor(role: string | null | undefined): string {
  return can(role, 'dashboard.view') ? '/' : '/products';
}
