import { AlertTriangle } from 'lucide-react';
import type { Order } from '@/types';
import { isEditableLocally, orderDisplayId } from '@/lib/orders';
import { orderStatusBadge, paymentStatusBadge } from '@/lib/status';
import {
  formatCurrency, statusLabel, sourceLabel, storefrontLabel, paymentMethodLabel, gatewayLabel,
  utmSourceLabel, utmMediumLabel, capitalizeWords,
} from '@/lib/formatters';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/StatusBadge';
import OrderTimeline from '@/components/OrderTimeline';
import OrderFinancialSummary from '@/components/OrderFinancialSummary';
import OrderShippingInfo from '@/components/OrderShippingInfo';
import OrderCustomerInfo from '@/components/OrderCustomerInfo';
import OrderItemsTable from '@/components/OrderItemsTable';

const orderStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  updating: boolean;
  onChangeStatus: (status: string) => void;
  onCancel: () => void;
}

export function OrderDetailSheet({ order, open, onOpenChange, canManage, updating, onChangeStatus, onCancel }: OrderDetailSheetProps) {
  const status = order ? orderStatusBadge(order) : null;
  const payment = order ? paymentStatusBadge(order.payment_status) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {order && status ? (
          <>
            <SheetHeader className="space-y-2 text-left">
              <SheetTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span>Pedido {orderDisplayId(order)}</span>
                <span className="text-lg font-semibold tabular-nums text-muted-foreground">{formatCurrency(order.total_amount)}</span>
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge {...status} />
                  {payment ? <StatusBadge {...payment} /> : null}
                  {order.cost_incomplete ? <StatusBadge tone="warning" label="Custo incompleto" /> : null}
                  <span className="text-xs text-muted-foreground">
                    {sourceLabel(order.source)}
                    {order.storefront ? ` · ${storefrontLabel(order.storefront)}` : ''}
                  </span>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-6">
              {order.cost_incomplete && order.missing_items?.length ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Custo incompleto</AlertTitle>
                  <AlertDescription>
                    {order.missing_items.length === 1 ? 'Um item deste pedido não está' : `${order.missing_items.length} itens deste pedido não estão`} cadastrados no AuraSync,
                    por isso o custo e o lucro não os consideram. Sincronize os produtos com a Nuvemshop e depois os pedidos.
                    <ul className="mt-2 list-disc pl-4">
                      {order.missing_items.map((item) => (
                        <li key={item.nuvemshop_variant_id}>
                          Variação {item.nuvemshop_variant_id} na Nuvemshop: {item.quantity} × {formatCurrency(item.unit_price)}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Section title="Linha do tempo">
                <OrderTimeline
                  created_at={order.created_at}
                  paid_at={order.paid_at}
                  shipped_at={order.shipped_at}
                  completed_at={order.completed_at}
                  cancelled_at={order.cancelled_at}
                />
              </Section>

              <Section title="Itens">
                <div className="-mx-1 overflow-x-auto">
                  <OrderItemsTable items={order.items} />
                </div>
              </Section>

              <Section title="Financeiro">
                <OrderFinancialSummary order={order} />
              </Section>

              <div className="grid gap-4 sm:grid-cols-2">
                <Section title="Cliente">
                  <OrderCustomerInfo customer_name={order.customer_name} customer_email={order.customer_email} />
                </Section>
                <Section title="Pagamento">
                  <div className="space-y-1 text-sm">
                    <p>
                      {order.payment_method ? paymentMethodLabel(order.payment_method) : '-'}
                      {order.payment_installments ? ` (${order.payment_installments}x)` : ''}
                    </p>
                    {order.gateway ? <p className="text-muted-foreground">Intermediador: {gatewayLabel(order.gateway)}</p> : null}
                  </div>
                </Section>
                <Section title="Frete e entrega">
                  <OrderShippingInfo
                    shipping_cost_customer={order.shipping_cost_customer}
                    shipping_cost_owner={order.shipping_cost_owner}
                    shipping_carrier={order.shipping_carrier}
                    has_free_shipping={order.has_free_shipping}
                    shipping_city={order.shipping_city}
                    shipping_province={order.shipping_province}
                  />
                </Section>
                <Section title="Origem do tráfego">
                  {order.utm_source || order.utm_medium || order.utm_campaign || order.utm_content || order.utm_term ? (
                    <div className="space-y-1 text-sm">
                      {order.utm_source ? <p><span className="text-muted-foreground">Fonte: </span>{utmSourceLabel(order.utm_source)}</p> : null}
                      {order.utm_medium ? <p><span className="text-muted-foreground">Mídia: </span>{utmMediumLabel(order.utm_medium)}</p> : null}
                      {order.utm_campaign ? <p className="break-all"><span className="text-muted-foreground">Campanha: </span>{capitalizeWords(order.utm_campaign)}</p> : null}
                      {order.utm_content ? <p className="break-all"><span className="text-muted-foreground">Conteúdo: </span>{capitalizeWords(order.utm_content)}</p> : null}
                      {order.utm_term ? <p className="break-all"><span className="text-muted-foreground">Termo: </span>{capitalizeWords(order.utm_term)}</p> : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem rastreamento (tráfego orgânico ou direto)</p>
                  )}
                </Section>
              </div>

              {canManage && !isEditableLocally(order) ? (
                <p className="text-sm text-muted-foreground">
                  Pedido da Nuvemshop: a situação é alterada na própria Nuvemshop e chega aqui pela sincronização.
                </p>
              ) : null}

              {canManage && isEditableLocally(order) ? (
                <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                  <Select
                    value={order.status}
                    disabled={updating}
                    onValueChange={(value) => {
                      // Cancelling always goes through the confirmation (it returns the stock).
                      if (value === 'CANCELED') onCancel();
                      else onChangeStatus(value);
                    }}
                  >
                    <SelectTrigger className="flex-1" aria-label="Situação do pedido">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((s) => (
                        <SelectItem key={s} value={s} disabled={s === order.status}>
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" disabled={status.tone === 'danger'} onClick={onCancel}>
                    Cancelar pedido
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
