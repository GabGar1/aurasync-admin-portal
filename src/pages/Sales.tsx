import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Wallet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { externalSalesApi } from '@/services/api';
import { externalSaleSchema, type ExternalSaleFormValues } from '@/lib/schemas';
import { paymentMethodLabel } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import VariantPicker, { type PickedVariant } from '@/components/VariantPicker';
import CustomerPicker from '@/components/sales/CustomerPicker';
import SaleResultDialog from '@/components/sales/SaleResultDialog';
import type { ExternalSaleResult } from '@/types';

type ApiError = {
  response?: { data?: { error?: string } };
  message?: string;
};

const paymentMethods = ['credit_card', 'debit_card', 'pix', 'bank_transfer', 'boleto', 'cash'] as const;
const saleStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'] as const;

export default function Sales() {
  const { getUser } = useAuth();
  const admin = isAdmin(getUser()?.role);
  const qc = useQueryClient();

  const form = useForm<ExternalSaleFormValues>({
    resolver: zodResolver(externalSaleSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      items: [{ variant_id: '', quantity: 1, unit_price: 0 }],
      discount_amount: undefined,
      payment_method: '',
      gateway: '',
      payment_installments: undefined,
      shipping_cost_owner: undefined,
      shipping_cost_customer: undefined,
      status: 'PAID',
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const [pickedVariants, setPickedVariants] = useState<(PickedVariant | null)[]>([null]);
  const [resultSale, setResultSale] = useState<ExternalSaleResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  function addItem() {
    append({ variant_id: '', quantity: 1, unit_price: 0 });
    setPickedVariants((prev) => [...prev, null]);
  }

  function removeItem(index: number) {
    remove(index);
    setPickedVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function selectVariant(index: number, variant: PickedVariant) {
    form.setValue(`items.${index}.variant_id`, variant.variant_id);
    form.setValue(`items.${index}.unit_price`, variant.price);
    setPickedVariants((prev) => prev.map((picked, i) => (i === index ? variant : picked)));
  }

  const createMutation = useMutation({
    mutationFn: (payload: ExternalSaleFormValues) => externalSalesApi.create({
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email?.trim() ? payload.customer_email.trim() : undefined,
      items: payload.items.map((item) => ({
        variant_id: item.variant_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
      discount_amount: payload.discount_amount === undefined || payload.discount_amount === '' ? undefined : Number(payload.discount_amount),
      payment_method: payload.payment_method || undefined,
      gateway: payload.gateway?.trim() ? payload.gateway.trim() : undefined,
      payment_installments: payload.payment_installments === undefined || payload.payment_installments === '' ? undefined : Number(payload.payment_installments),
      shipping_cost_owner: payload.shipping_cost_owner === undefined || payload.shipping_cost_owner === '' ? undefined : Number(payload.shipping_cost_owner),
      shipping_cost_customer: payload.shipping_cost_customer === undefined || payload.shipping_cost_customer === '' ? undefined : Number(payload.shipping_cost_customer),
      status: payload.status,
    }),
    onSuccess: (sale) => {
      toast.success('Venda registrada com sucesso');
      setResultSale(sale);
      setResultOpen(true);
      form.reset({
        customer_name: '',
        customer_email: '',
        items: [{ variant_id: '', quantity: 1, unit_price: 0 }],
        discount_amount: undefined,
        payment_method: '',
        gateway: '',
        payment_installments: undefined,
        shipping_cost_owner: undefined,
        shipping_cost_customer: undefined,
        status: 'PAID',
      });
      setPickedVariants([null]);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: ApiError) => toast.error(`Falha ao registrar venda: ${err?.response?.data?.error || err?.message || 'Erro desconhecido'}`),
  });

  const customerEmail = form.watch('customer_email');

  if (!admin) {
    return (
      <div className="flex items-center justify-center p-16">
        <Alert className="w-full max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Você não tem permissão para registrar vendas externas.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 space-y-6 motion-safe:animate-fade-in-up">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold">Realizar Venda</h1>
        <p className="text-sm text-muted-foreground">Registrar venda externa fora da loja online</p>
      </div>

      <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="space-y-6 max-w-3xl">
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h3>
          <CustomerPicker
            onSelect={(customer) => {
              form.setValue('customer_name', customer.name);
              form.setValue('customer_email', customer.email ?? '');
            }}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-customer-name">Nome *</Label>
              <Input
                id="sale-customer-name"
                placeholder="Nome do cliente"
                {...form.register('customer_name')}
              />
              {form.formState.errors.customer_name ? (
                <p className="text-sm text-destructive">{form.formState.errors.customer_name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-customer-email">Email</Label>
              <Input
                id="sale-customer-email"
                type="email"
                placeholder="email@exemplo.com"
                {...form.register('customer_email')}
              />
              {form.formState.errors.customer_email ? (
                <p className="text-sm text-destructive">{form.formState.errors.customer_email.message}</p>
              ) : null}
            </div>
          </div>
          {!customerEmail ? (
            <p className="text-xs text-muted-foreground">
              Cliente sem email não será salvo no cadastro de clientes.
            </p>
          ) : null}
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Itens</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Item
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 border rounded-md p-3">
              <VariantPicker
                value={pickedVariants[index] ?? null}
                onSelect={(variant: PickedVariant) => selectVariant(index, variant)}
              />
              {form.formState.errors.items?.[index]?.variant_id ? (
                <p className="text-sm text-destructive">{form.formState.errors.items[index].variant_id.message}</p>
              ) : null}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...form.register(`items.${index}.unit_price`)}
                  />
                </div>
                <div className="w-24">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 h-9 w-9 text-destructive shrink-0"
                  onClick={() => removeItem(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {form.formState.errors.items?.root?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
          ) : null}
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pagamento e frete</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={form.watch('payment_method')} onValueChange={(value) => form.setValue('payment_method', value)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{paymentMethodLabel(method)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-gateway">Gateway</Label>
              <Input id="sale-gateway" placeholder="Ex: Mercado Pago" {...form.register('gateway')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-discount">Desconto (R$)</Label>
              <Input id="sale-discount" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('discount_amount')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-installments">Parcelas</Label>
              <Input id="sale-installments" type="number" min="1" placeholder="1" {...form.register('payment_installments')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-status">Status</Label>
              <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as ExternalSaleFormValues['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {saleStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale-shipping-owner">Frete pago pela loja (R$)</Label>
              <Input id="sale-shipping-owner" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('shipping_cost_owner')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-shipping-customer">Frete pago pelo cliente (R$)</Label>
              <Input id="sale-shipping-customer" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('shipping_cost_customer')} />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
          {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
          Registrar Venda
        </Button>
      </form>

      <SaleResultDialog open={resultOpen} onOpenChange={setResultOpen} sale={resultSale} />
    </div>
  );
}
