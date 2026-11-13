import { describe, it, expect } from 'vitest';
import {
  typeLabel, categoryLabel, calculationBaseLabel, storefrontLabel,
  sourceLabel, paymentMethodLabel, statusLabel, preferLabel, marginPercent,
  roleLabel, utmSourceLabel, utmMediumLabel, capitalizeWords, effectiveOrderStatus, gatewayLabel,
  allocationBasisLabel, formatDateOnly, inventoryTypeLabel, provinceCode,
} from './formatters';

describe('provinceCode', () => {
  it('abrevia o nome do estado para a sigla, sem depender de acento ou caixa', () => {
    expect(provinceCode('São Paulo')).toBe('SP');
    expect(provinceCode('rio grande do sul')).toBe('RS');
    expect(provinceCode('Distrito Federal')).toBe('DF');
    expect(provinceCode('SP')).toBe('SP');
  });

  it('mantém o texto original quando não reconhece e trata vazio', () => {
    expect(provinceCode('Buenos Aires')).toBe('Buenos Aires');
    expect(provinceCode(null)).toBe('-');
  });
});

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
    expect(paymentMethodLabel('credit_card')).toBe('Cartão de crédito');
    expect(paymentMethodLabel('debit_card')).toBe('Cartão de débito');
    expect(paymentMethodLabel('pix')).toBe('Pix');
    expect(paymentMethodLabel('other')).toBe('Outros');
    expect(paymentMethodLabel('wire_transfer')).toBe('Transferência bancária');
  });

  it('traduz intermediadores de pagamento', () => {
    expect(gatewayLabel('nuvem-pago')).toBe('Nuvem Pago');
    expect(gatewayLabel('mercado-pago')).toBe('Mercado Pago');
    expect(gatewayLabel('pagseguro')).toBe('PagSeguro');
    expect(gatewayLabel('outro-gateway')).toBe('Outro Gateway');
    expect(gatewayLabel(null)).toBe('-');
  });

  it('usa os mesmos rótulos de situação da API', () => {
    expect(statusLabel('open')).toBe('Em aberto');
    expect(statusLabel('closed')).toBe('Concluído');
    expect(statusLabel('MARKED_AS_FULFILLED')).toBe('Marcado como concluído');
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

  it('formata datas AAAA-MM-DD sem deslocamento de fuso', () => {
    expect(formatDateOnly('2026-08-01')).toBe('01/08/2026');
    expect(formatDateOnly('2026-08-31')).toBe('31/08/2026');
    expect(formatDateOnly(null)).toBe('-');
    expect(formatDateOnly('não é data')).toBe('não é data');
  });
});

describe('rótulos novos', () => {
  it('traduz papéis de usuário', () => {
    expect(roleLabel('ADMIN')).toBe('Administrador');
    expect(roleLabel('EMPLOYEE')).toBe('Funcionário');
    expect(roleLabel('SUPER_ADMIN')).toBe('Superadministrador');
    expect(roleLabel('DESCONHECIDO')).toBe('DESCONHECIDO');
  });

  it('traduz fontes UTM', () => {
    expect(utmSourceLabel('ig')).toBe('Instagram');
    expect(utmSourceLabel('fb')).toBe('Facebook');
    expect(utmSourceLabel('IGShopping')).toBe('Instagram Shopping');
    expect(utmSourceLabel('nuvem-app')).toBe('Nuvemshop App');
    expect(utmSourceLabel('chatgpt.com')).toBe('ChatGPT');
    expect(utmSourceLabel(null)).toBe('Orgânico');
    expect(utmSourceLabel('N/A')).toBe('Orgânico');
    expect(utmSourceLabel('google ads')).toBe('Google Ads');
  });

  it('traduz mídias UTM', () => {
    expect(utmMediumLabel('paid')).toBe('Pago');
    expect(utmMediumLabel('social')).toBe('Social');
    expect(utmMediumLabel('referral')).toBe('Indicação');
    expect(utmMediumLabel(null)).toBe('Orgânico');
    expect(utmMediumLabel('unknown_medium')).toBe('Unknown Medium');
  });

  it('capitaliza palavras', () => {
    expect(capitalizeWords('nuvem-app')).toBe('Nuvem App');
    expect(capitalizeWords('foo bar')).toBe('Foo Bar');
  });

  it('deriva o status efetivo pela linha do tempo', () => {
    expect(effectiveOrderStatus({ status: 'PENDING', paid_at: 'x', shipped_at: 'x', completed_at: 'x' }).label).toBe('Entregue');
    expect(effectiveOrderStatus({ status: 'PENDING', paid_at: 'x', shipped_at: 'x' }).label).toBe('Enviado');
    expect(effectiveOrderStatus({ status: 'PENDING', paid_at: 'x' }).label).toBe('Pago');
    expect(effectiveOrderStatus({ status: 'PENDING', cancelled_at: 'x', completed_at: 'x' }).label).toBe('Cancelado');
    expect(effectiveOrderStatus({ status: 'DISPATCHED' }).label).toBe('Despachado');
    expect(effectiveOrderStatus({ status: 'UNPACKED' }).label).toBe('Empacotando');
    expect(effectiveOrderStatus({ status: 'MARKED_AS_FULFILLED' }).label).toBe('Marcado como concluído');
  });

  it('prioriza estornado/reembolsado sobre completed_at', () => {
    expect(effectiveOrderStatus({ status: 'voided', completed_at: 'x' })).toEqual({ key: 'voided', label: 'Estornado' });
    expect(effectiveOrderStatus({ status: 'refunded', completed_at: 'x' }).label).toBe('Reembolsado');
    expect(effectiveOrderStatus({ status: 'VOIDED', completed_at: 'x' }).label).toBe('Estornado');
  });

  it('traduz PACKED', () => {
    expect(statusLabel('PACKED')).toBe('Empacotado');
  });

  it('normaliza status cancelado antes da linha do tempo', () => {
    expect(effectiveOrderStatus({ status: 'CANCELED' })).toEqual({ key: 'cancelled', label: 'Cancelado' });
    expect(effectiveOrderStatus({ status: 'cancelled', paid_at: 'x' }).label).toBe('Cancelado');
    expect(effectiveOrderStatus({ status: 'cancelled', paid_at: 'x' }).key).toBe('cancelled');
  });

  it('traduz tipos novos do motor de custos', () => {
    expect(typeLabel('PACKAGING')).toBe('Embalagem');
    expect(typeLabel('MONTHLY_FIXED')).toBe('Mensal fixo');
    expect(typeLabel('MONTHLY_PERCENT')).toBe('Mensal (%)');
  });

  it('traduz base de rateio mensal', () => {
    expect(allocationBasisLabel('PER_ORDER')).toBe('Por pedido');
    expect(allocationBasisLabel('PER_PRODUCT')).toBe('Por produto vendido');
    expect(allocationBasisLabel('OUTRO')).toBe('OUTRO');
  });

  it('traduz categorias novas', () => {
    expect(categoryLabel('ACQUISITION')).toBe('Custo de aquisição');
    expect(categoryLabel('CREDIT_FEE')).toBe('Taxa de crédito');
  });

  it('ajusta pix e storefronts', () => {
    expect(paymentMethodLabel('pix')).toBe('Pix');
    expect(storefrontLabel('mobile')).toBe('Celular');
    expect(storefrontLabel('store')).toBe('Site');
    expect(storefrontLabel('web')).toBe('Site');
  });

  it('traduz tipos de transação de inventário', () => {
    expect(inventoryTypeLabel('SALE')).toBe('Venda');
    expect(inventoryTypeLabel('RESTOCK')).toBe('Reabastecimento');
    expect(inventoryTypeLabel('ADJUSTMENT')).toBe('Ajuste manual');
    expect(inventoryTypeLabel('TIPO_DESCONHECIDO')).toBe('TIPO_DESCONHECIDO');
  });
});
