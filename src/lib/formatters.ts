const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number | null | undefined): string {
  return currencyFormatter.format(value ?? 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
  bank_transfer: 'Transferência bancária',
  cash: 'Dinheiro',
  nuvem_pago: 'Nuvem Pago',
};

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return '-';
  return paymentMethodLabels[method] ?? method;
}

export const statusLabels: Record<string, string> = {
  open: 'Ativo',
  paid: 'Pago',
  shipped: 'Enviado',
  closed: 'Arquivado',
  cancelled: 'Cancelado',
  PENDING: 'Pendente',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
  refunded: 'Reembolsado',
  voided: 'Estornado',
};

export function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

const typeLabels: Record<string, string> = {
  FIXED: 'Valor fixo',
  PERCENT: 'Percentual',
  PER_ORDER: 'Por pedido',
  MONTHLY: 'Mensal (controle)',
};

export function typeLabel(type: string): string {
  return typeLabels[type] ?? type;
}

const categoryLabels: Record<string, string> = {
  PACKAGING: 'Embalagem',
  TAX: 'Imposto',
  FEE: 'Taxa',
  SHIPPING: 'Frete',
  OPERATIONAL: 'Operacional',
  MARKETING: 'Marketing',
  OTHER: 'Outros',
};

export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? category;
}

const calculationBaseLabels: Record<string, string> = {
  PRICE: 'Preço de venda',
  COST: 'Custo do produto',
};

export function calculationBaseLabel(base: string): string {
  return calculationBaseLabels[base] ?? base;
}

const storefrontLabels: Record<string, string> = {
  mobile: 'Celular',
  web: 'Site',
  other_devices: 'Outros dispositivos',
};

export function storefrontLabel(storefront: string | null | undefined): string {
  if (!storefront) return '-';
  return storefrontLabels[storefront] ?? storefront;
}

const sourceLabels: Record<string, string> = {
  NUVEMSHOP: 'Nuvemshop',
  EXTERNAL: 'Venda externa',
};

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return '-';
  return sourceLabels[source] ?? source;
}

export function preferLabel(apiLabel: string | null | undefined, fallback: string): string {
  return apiLabel || fallback;
}

export function marginPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)}%`;
}
