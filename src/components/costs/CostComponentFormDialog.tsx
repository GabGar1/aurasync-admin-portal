import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { costComponentSchema, type CostComponentFormValues } from '@/lib/schemas';
import { categoryLabel, typeLabel } from '@/lib/formatters';
import type { CostComponent, CostComponentPayload } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: CostComponent | null;
  isPending: boolean;
  onSubmit: (payload: CostComponentPayload) => void;
}

export default function CostComponentFormDialog({ open, onOpenChange, component, isPending, onSubmit }: Props) {
  const form = useForm<CostComponentFormValues>({
    resolver: zodResolver(costComponentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'FIXED',
      category: 'OTHER',
      value: 0,
      calculation_base: 'PRICE',
      is_active: true,
      max_products_per_package: undefined,
      consolidates: false,
      allocation_basis: undefined,
      period_start: '',
      period_end: '',
      applies_to_fair_only: false,
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (open) {
      form.reset(component ? {
        name: component.name,
        description: component.description ?? '',
        type: component.type,
        category: component.category,
        value: component.value,
        calculation_base: component.calculation_base,
        is_active: component.is_active,
        max_products_per_package: component.max_products_per_package ?? undefined,
        consolidates: component.consolidates,
        allocation_basis: component.allocation_basis ?? undefined,
        period_start: component.period_start ?? '',
        period_end: component.period_end ?? '',
        applies_to_fair_only: component.applies_to_fair_only,
      } : {
        name: '',
        description: '',
        type: 'FIXED',
        category: 'OTHER',
        value: 0,
        calculation_base: 'PRICE',
        is_active: true,
        max_products_per_package: undefined,
        consolidates: false,
        allocation_basis: undefined,
        period_start: '',
        period_end: '',
        applies_to_fair_only: false,
      });
    }
  }, [open, component, form]);

  function handleSubmit(values: CostComponentFormValues) {
    const payload: CostComponentPayload = {
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
      type: values.type,
      category: values.category,
      value: values.value,
      is_active: values.is_active,
      consolidates: values.consolidates,
      applies_to_fair_only: values.applies_to_fair_only,
      period_start: values.period_start ? values.period_start : undefined,
      period_end: values.period_end ? values.period_end : undefined,
    };
    if (values.type === 'PERCENT' && values.calculation_base) {
      payload.calculation_base = values.calculation_base;
    }
    if (values.type === 'PACKAGING' && values.max_products_per_package !== undefined) {
      payload.max_products_per_package = values.max_products_per_package;
    }
    if (values.type === 'MONTHLY_FIXED' && values.allocation_basis) {
      payload.allocation_basis = values.allocation_basis;
    }
    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{component ? 'Editar Componente de Custo' : 'Novo Componente de Custo'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Embalagem premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(['FIXED', 'PERCENT', 'PER_ORDER', 'PACKAGING', 'MONTHLY_FIXED', 'MONTHLY_PERCENT'] as const).map((type) => (
                          <SelectItem key={type} value={type}>{typeLabel(type)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(['PACKAGING', 'TAX', 'FEE', 'SHIPPING', 'OPERATIONAL', 'MARKETING', 'OTHER', 'ACQUISITION', 'CREDIT_FEE'] as const).map((category) => (
                          <SelectItem key={category} value={category}>{categoryLabel(category)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedType === 'PERCENT' || selectedType === 'MONTHLY_PERCENT' ? 'Valor (%)' : 'Valor (R$)'}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedType === 'PERCENT' ? (
                <FormField
                  control={form.control}
                  name="calculation_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base de cálculo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRICE">Preço de venda</SelectItem>
                          <SelectItem value="COST">Custo do produto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            {selectedType === 'PACKAGING' ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_products_per_package"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máx. produtos por caixa</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="Ex: 6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consolidates"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Caixa consolidadora</FormLabel>
                        <p className="text-xs text-muted-foreground">Absorve os itens dos demais subgrupos</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            {selectedType === 'MONTHLY_FIXED' ? (
              <FormField
                control={form.control}
                name="allocation_basis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base de rateio</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PER_ORDER">Por pedido</SelectItem>
                        <SelectItem value="PER_PRODUCT">Por produto vendido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">Componente participa do cálculo de custos</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applies_to_fair_only"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Somente vendas de Feira</FormLabel>
                    <p className="text-xs text-muted-foreground">Incide apenas quando o pedido é marcado como Feira</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início do período</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim do período</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : (component ? 'Salvar' : 'Criar Componente')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
