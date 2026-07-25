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
  nuvem_pago: 'Nuvem Pago',
};

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return '-';
  return paymentMethodLabels[method] ?? method;
}

export const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PENDING: 'blue',
  PAID: 'green',
  SHIPPED: 'orange',
  DELIVERED: 'cyan',
  CANCELED: 'red',
};

export function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

export function statusColor(status: string): string {
  return statusColors[status] ?? 'default';
}
