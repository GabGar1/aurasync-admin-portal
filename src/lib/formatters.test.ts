import { describe, it, expect } from 'vitest';
import {
  typeLabel, categoryLabel, calculationBaseLabel, storefrontLabel,
  sourceLabel, paymentMethodLabel, statusLabel, preferLabel, marginPercent,
} from './formatters';

describe('glossário PT-BR', () => {
  it('traduz tipos de componente de custo', () => {
    expect(typeLabel('FIXED')).toBe('Valor fixo');
    expect(typeLabel('PERCENT')).toBe('Percentual');
    expect(typeLabel('PER_ORDER')).toBe('Por pedido');
    expect(typeLabel('MONTHLY')).toBe('Mensal (controle)');
    expect(typeLabel('desconhecido')).toBe('desconhecido');
  });

  it('traduz categorias de componente', () => {
    expect(categoryLabel('PACKAGING')).toBe('Embalagem');
    expect(categoryLabel('TAX')).toBe('Imposto');
    expect(categoryLabel('FEE')).toBe('Taxa');
    expect(categoryLabel('SHIPPING')).toBe('Frete');
    expect(categoryLabel('OPERATIONAL')).toBe('Operacional');
    expect(categoryLabel('MARKETING')).toBe('Marketing');
    expect(categoryLabel('OTHER')).toBe('Outros');
  });

  it('traduz base de cálculo', () => {
    expect(calculationBaseLabel('PRICE')).toBe('Preço de venda');
    expect(calculationBaseLabel('COST')).toBe('Custo do produto');
  });

  it('traduz storefront', () => {
    expect(storefrontLabel('mobile')).toBe('Celular');
    expect(storefrontLabel('web')).toBe('Site');
    expect(storefrontLabel('other_devices')).toBe('Outros dispositivos');
    expect(storefrontLabel(null)).toBe('-');
  });

  it('traduz origem do pedido', () => {
    expect(sourceLabel('NUVEMSHOP')).toBe('Nuvemshop');
    expect(sourceLabel('EXTERNAL')).toBe('Venda externa');
    expect(sourceLabel('EXTERNAL')).not.toBe('EXTERNAL');
  });

  it('traduz formas de pagamento estendidas', () => {
    expect(paymentMethodLabel('cash')).toBe('Dinheiro');
    expect(paymentMethodLabel('bank_transfer')).toBe('Transferência bancária');
    expect(paymentMethodLabel('credit_card')).toBe('Cartão de Crédito');
    expect(paymentMethodLabel('pix')).toBe('PIX');
  });

  it('traduz status estendidos', () => {
    expect(statusLabel('PENDING')).toBe('Pendente');
    expect(statusLabel('DELIVERED')).toBe('Entregue');
    expect(statusLabel('paid')).toBe('Pago');
  });

  it('prefere label da API, com fallback local', () => {
    expect(preferLabel('Venda concretizada', 'Em aberto')).toBe('Venda concretizada');
    expect(preferLabel(null, 'Em aberto')).toBe('Em aberto');
    expect(preferLabel(undefined, 'Em aberto')).toBe('Em aberto');
  });

  it('formata margem em percentual pt-BR', () => {
    expect(marginPercent(12.5)).toBe('12,5%');
    expect(marginPercent(0)).toBe('0%');
    expect(marginPercent(null)).toBe('-');
  });
});
