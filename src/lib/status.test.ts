import { describe, it, expect } from 'vitest';
import { orderStatusBadge, activeBadge, roleBadge, inventoryTypeBadge, paymentStatusBadge } from './status';

describe('orderStatusBadge', () => {
  it('usa cores semânticas coerentes (entregue verde, cancelado vermelho)', () => {
    expect(orderStatusBadge({ status: 'DELIVERED' })).toEqual({ tone: 'success', label: 'Entregue' });
    expect(orderStatusBadge({ status: 'CANCELED' })).toEqual({ tone: 'danger', label: 'Cancelado' });
    expect(orderStatusBadge({ status: 'PAID' }).tone).toBe('info');
    expect(orderStatusBadge({ status: 'SHIPPED' }).tone).toBe('brand');
    expect(orderStatusBadge({ status: 'PENDING' }).tone).toBe('warning');
  });

  it('segue a mesma regra de status efetivo em todas as telas', () => {
    expect(orderStatusBadge({ status: 'PENDING', paid_at: '2026-01-01' }).label).toBe('Pago');
    expect(orderStatusBadge({ status: 'voided' }).tone).toBe('danger');
  });
});

describe('outros selos', () => {
  it('ativo/inativo', () => {
    expect(activeBadge(true)).toEqual({ tone: 'success', label: 'Ativo' });
    expect(activeBadge(false)).toEqual({ tone: 'neutral', label: 'Inativo' });
  });

  it('função do usuário', () => {
    expect(roleBadge('SUPER_ADMIN')).toEqual({ tone: 'brand', label: 'Superadministrador' });
    expect(roleBadge('ADMIN').tone).toBe('info');
    expect(roleBadge('EMPLOYEE')).toEqual({ tone: 'neutral', label: 'Funcionário' });
  });

  it('tipo de movimentação de estoque', () => {
    expect(inventoryTypeBadge('SALE').tone).toBe('info');
    expect(inventoryTypeBadge('RESTOCK').tone).toBe('success');
    expect(inventoryTypeBadge('ADJUSTMENT').tone).toBe('warning');
  });

  it('situação do pagamento', () => {
    expect(paymentStatusBadge('paid').tone).toBe('success');
    expect(paymentStatusBadge('pending').tone).toBe('warning');
    expect(paymentStatusBadge('refunded').tone).toBe('danger');
    expect(paymentStatusBadge(null)).toBeNull();
  });
});
