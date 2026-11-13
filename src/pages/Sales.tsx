import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Wallet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { externalSalesApi, getFriendlyError } from '@/services/api';
import { externalSaleSchema, type ExternalSaleFormValues } from '@/lib/schemas';
import { formatCurrency, paymentMethodLabel, statusLabel } from '@/lib/formatters';
import { isPreviewable, toExternalSalePayload } from '@/lib/sales';
import { useSalePreview } from '@/hooks/useSalePreview';
import { SaleSummary } from '@/components/sales/SaleSummary';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import VariantPicker, { type PickedVariant } from '@/components/VariantPicker';
import CustomerPicker from '@/components/sales/CustomerPicker';
import SaleResultDialog from '@/components/sales/SaleResultDialog';
import CreateCustomerDialog from '@/components/sales/CreateCustomerDialog';
import type { ExternalSaleResult } from '@/types';

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
      is_fair: false,
      status: 'PAID',
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const [pickedVariants, setPickedVariants] = useState<(PickedVariant | null)[]>([null]);
  const [resultSale, setResultSale] = useState<ExternalSaleResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

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
    mutationFn: (values: ExternalSaleFormValues) => externalSalesApi.create(toExternalSalePayload(values)),
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
        is_fair: false,
        status: 'PAID',
      });
      setPickedVariants([null]);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => toast.error(`Falha ao registrar venda: ${getFriendlyError(err)}`),
  });

  const customerEmail = form.watch('customer_email');
  const livePayload = toExternalSalePayload(form.watch());
  const preview = useSalePreview(livePayload);

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
    <div className="flex flex-col space-y-6 p-4 motion-safe:animate-fade-in-up sm:p-6">
      <PageHeader title="Venda externa" description="Registre vendas feitas fora da loja online, como em feiras e no WhatsApp" />

      <form
        onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
        className="grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="min-w-0 space-y-6">
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setCustomerDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar cliente
            </Button>
          </div>
          <CustomerPicker
            onSelect={(customer) => {
              form.setValue('customer_name', customer.name);
              form.setValue('customer_email', customer.email ?? '');
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="sale-customer-email">E-mail</Label>
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

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Itens</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar item
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-md border p-3">
              <div className="space-y-2">
                <Label>Produto</Label>
                <VariantPicker
                  value={pickedVariants[index] ?? null}
                  onSelect={(variant: PickedVariant) => selectVariant(index, variant)}
                />
              </div>
              {form.formState.errors.items?.[index]?.variant_id ? (
                <p className="text-sm text-destructive">{form.formState.errors.items[index].variant_id.message}</p>
              ) : null}
              <div className="flex gap-2">
                <div className="w-32 sm:w-40">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...form.register(`items.${index}.unit_price`)}
                  />
                  {form.formState.errors.items?.[index]?.unit_price ? (
                    <p className="text-sm text-destructive">{form.formState.errors.items[index].unit_price.message}</p>
                  ) : null}
                </div>
                <div className="w-20">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`)}
                  />
                  {form.formState.errors.items?.[index]?.quantity ? (
                    <p className="text-sm text-destructive">{form.formState.errors.items[index].quantity.message}</p>
                  ) : null}
                </div>
                <div className="flex-1 text-right">
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p className="mt-2 font-medium tabular-nums">
                    {formatCurrency((livePayload.items[index]?.unit_price || 0) * (livePayload.items[index]?.quantity || 0))}
                  </p>
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

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pagamento e frete</h3>
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="sale-gateway">Intermediador de pagamento</Label>
              <Input id="sale-gateway" placeholder="Ex: Mercado Pago" {...form.register('gateway')} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sale-discount">Desconto (R$)</Label>
              <Input id="sale-discount" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('discount_amount')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-installments">Parcelas</Label>
              <Input id="sale-installments" type="number" min="1" placeholder="1" {...form.register('payment_installments')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-status">Situação do pedido</Label>
              <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as ExternalSaleFormValues['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {saleStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sale-shipping-owner">Frete pago pela loja (R$)</Label>
              <Input id="sale-shipping-owner" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('shipping_cost_owner')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-shipping-customer">Frete pago pelo cliente (R$)</Label>
              <Input id="sale-shipping-customer" type="number" step="0.01" min="0" placeholder="0,00" {...form.register('shipping_cost_customer')} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="sale-is-fair"
              checked={form.watch('is_fair') ?? false}
              onCheckedChange={(checked) => form.setValue('is_fair', checked)}
            />
            <Label htmlFor="sale-is-fair" className="cursor-pointer">Venda em feira</Label>
          </div>
        </div>
        </div>

        <SaleSummary
          ready={isPreviewable(livePayload)}
          loading={preview.isFetching}
          preview={preview.data}
          error={preview.isError ? getFriendlyError(preview.error) : null}
          action={
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
              Registrar venda
            </Button>
          }
        />
      </form>

      <CreateCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onCreated={(customer) => {
          form.setValue('customer_name', customer.name);
          form.setValue('customer_email', customer.email ?? '');
        }}
      />

      <SaleResultDialog open={resultOpen} onOpenChange={setResultOpen} sale={resultSale} />
    </div>
  );
}
