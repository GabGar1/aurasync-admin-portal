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
      } : {
        name: '',
        description: '',
        type: 'FIXED',
        category: 'OTHER',
        value: 0,
        calculation_base: 'PRICE',
        is_active: true,
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
    };
    if (values.type === 'PERCENT' && values.calculation_base) {
      payload.calculation_base = values.calculation_base;
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
                        {(['FIXED', 'PERCENT', 'PER_ORDER', 'MONTHLY'] as const).map((type) => (
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
                        {(['PACKAGING', 'TAX', 'FEE', 'SHIPPING', 'OPERATIONAL', 'MARKETING', 'OTHER'] as const).map((category) => (
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
                    <FormLabel>Valor (R$ ou %)</FormLabel>
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
