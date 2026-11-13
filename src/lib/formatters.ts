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

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
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
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  pix: 'Pix',
  boleto: 'Boleto',
  ticket: 'Boleto',
  bank_transfer: 'Transferência bancária',
  wire_transfer: 'Transferência bancária',
  cash: 'Dinheiro',
  wallet: 'Carteira digital',
  nuvem_pago: 'Nuvem Pago',
  other: 'Outros',
};

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return '-';
  return paymentMethodLabels[method] ?? method;
}

const gatewayLabels: Record<string, string> = {
  'nuvem-pago': 'Nuvem Pago',
  nuvem_pago: 'Nuvem Pago',
  'mercado-pago': 'Mercado Pago',
  mercadopago: 'Mercado Pago',
  pagseguro: 'PagSeguro',
  paypal: 'PayPal',
  pagarme: 'Pagar.me',
};

export function gatewayLabel(gateway: string | null | undefined): string {
  if (!gateway) return '-';
  return gatewayLabels[gateway.toLowerCase()] ?? capitalizeWords(gateway);
}

export const statusLabels: Record<string, string> = {
  open: 'Em aberto',
  paid: 'Pago',
  shipped: 'Enviado',
  closed: 'Concluído',
  cancelled: 'Cancelado',
  PENDING: 'Pendente',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
  refunded: 'Reembolsado',
  voided: 'Estornado',
  PACKED: 'Empacotado',
  packed: 'Empacotado',
  DISPATCHED: 'Despachado',
  UNPACKED: 'Empacotando',
  MARKED_AS_FULFILLED: 'Marcado como concluído',
};

export function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

const typeLabels: Record<string, string> = {
  FIXED: 'Valor fixo',
  PERCENT: 'Percentual',
  PER_ORDER: 'Por pedido',
  MONTHLY: 'Mensal (controle)',
  PACKAGING: 'Embalagem',
  MONTHLY_FIXED: 'Mensal fixo',
  MONTHLY_PERCENT: 'Mensal (%)',
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
  ACQUISITION: 'Custo de aquisição',
  CREDIT_FEE: 'Taxa de crédito',
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

const allocationBasisLabels: Record<string, string> = {
  PER_ORDER: 'Por pedido',
  PER_PRODUCT: 'Por produto vendido',
};

export function allocationBasisLabel(basis: string | null | undefined): string {
  if (!basis) return '-';
  return allocationBasisLabels[basis] ?? basis;
}

const storefrontLabels: Record<string, string> = {
  mobile: 'Celular',
  store: 'Site',
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

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  EMPLOYEE: 'Funcionário',
  SUPER_ADMIN: 'Superadministrador',
};

export function roleLabel(role: string): string {
  return roleLabels[role] ?? role;
}

const inventoryTypeLabels: Record<string, string> = {
  SALE: 'Venda',
  RESTOCK: 'Reabastecimento',
  ADJUSTMENT: 'Ajuste manual',
};

export function inventoryTypeLabel(type: string): string {
  return inventoryTypeLabels[type] ?? type;
}

export function capitalizeWords(value: string): string {
  return value
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const utmSourceLabels: Record<string, string> = {
  ig: 'Instagram',
  fb: 'Facebook',
  IGShopping: 'Instagram Shopping',
  'nuvem-app': 'Nuvemshop App',
  'chatgpt.com': 'ChatGPT',
};

export function utmSourceLabel(value: string | null | undefined): string {
  if (!value || value === 'N/A') return 'Orgânico';
  return utmSourceLabels[value] ?? capitalizeWords(value);
}

const utmMediumLabels: Record<string, string> = {
  paid: 'Pago',
  social: 'Social',
  referral: 'Indicação',
};

export function utmMediumLabel(value: string | null | undefined): string {
  if (!value || value === 'N/A') return 'Orgânico';
  return utmMediumLabels[value] ?? capitalizeWords(value);
}

const provinceCodes: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE', 'distrito federal': 'DF',
  'espirito santo': 'ES', goias: 'GO', maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI',
  'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR',
  'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};

/** Brazilian state name (as Nuvemshop sends it) to its two-letter code. */
export function provinceCode(province: string | null | undefined): string {
  if (!province) return '-';
  const trimmed = province.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const key = trimmed.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return provinceCodes[key] ?? trimmed;
}

export interface OrderStatusLike {
  status: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export function effectiveOrderStatus(order: OrderStatusLike): { key: string; label: string } {
  if (order.status === 'CANCELED' || order.status === 'cancelled') {
    return { key: 'cancelled', label: 'Cancelado' };
  }
  const normalizedStatus = order.status.toLowerCase();
  if (normalizedStatus === 'voided' || normalizedStatus === 'refunded') {
    return { key: 'voided', label: statusLabel(normalizedStatus) };
  }
  if (order.cancelled_at) return { key: 'cancelled', label: 'Cancelado' };
  if (order.completed_at) return { key: 'delivered', label: 'Entregue' };
  if (order.shipped_at) return { key: 'shipped', label: 'Enviado' };
  if (order.paid_at) return { key: 'paid', label: 'Pago' };
  return { key: order.status, label: statusLabel(order.status) };
}
