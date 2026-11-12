import { describe, it, expect } from 'vitest';
import { can, homePathFor } from './permissions';

// Mirrors the API: requireRole(['ADMIN','SUPER_ADMIN']) vs. routes open to any signed-in user.
describe('permissions', () => {
  it('employees can only browse products and inventory', () => {
    expect(can('EMPLOYEE', 'products.view')).toBe(true);
    expect(can('EMPLOYEE', 'inventory.view')).toBe(true);
    for (const p of ['dashboard.view', 'orders.view', 'users.manage', 'costs.manage', 'sales.create', 'customers.view', 'products.sync', 'inventory.adjust'] as const) {
      expect(can('EMPLOYEE', p)).toBe(false);
    }
  });

  it('admins and super admins can do everything in the panel', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN']) {
      expect(can(role, 'orders.view')).toBe(true);
      expect(can(role, 'users.manage')).toBe(true);
      expect(can(role, 'products.sync')).toBe(true);
    }
  });

  it('only super admins change roles', () => {
    expect(can('ADMIN', 'users.changeRole')).toBe(false);
    expect(can('SUPER_ADMIN', 'users.changeRole')).toBe(true);
  });

  it('denies unknown or missing roles', () => {
    expect(can(undefined, 'products.view')).toBe(false);
    expect(can('GOD', 'products.view')).toBe(false);
  });

  it('sends each role to the first page it can open', () => {
    expect(homePathFor('ADMIN')).toBe('/');
    expect(homePathFor('EMPLOYEE')).toBe('/products');
  });
});
