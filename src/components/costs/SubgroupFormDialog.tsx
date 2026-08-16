import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Save } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { productSubgroupSchema, type ProductSubgroupFormValues } from '@/lib/schemas';
import type { ProductSubgroup, ProductSubgroupPayload } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgroup: ProductSubgroup | null;
  isPending: boolean;
  onSubmit: (payload: ProductSubgroupPayload) => void;
}

export default function SubgroupFormDialog({ open, onOpenChange, subgroup, isPending, onSubmit }: Props) {
  const form = useForm<ProductSubgroupFormValues>({
    resolver: zodResolver(productSubgroupSchema),
    defaultValues: { name: '', description: '', is_active: true },
  });

  const isActive = form.watch('is_active');

  useEffect(() => {
    form.reset(subgroup ? {
      name: subgroup.name,
      description: subgroup.description ?? '',
      is_active: subgroup.is_active,
    } : {
      name: '',
      description: '',
      is_active: true,
    });
  }, [open, subgroup, form]);

  function handleSubmit(values: ProductSubgroupFormValues) {
    const payload: ProductSubgroupPayload = {
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
      is_active: values.is_active,
    };
    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subgroup ? 'Editar Subgrupo' : 'Novo Subgrupo'}</DialogTitle>
          <DialogDescription>
            {subgroup ? 'Atualize os dados do subgrupo de produtos.' : 'Cadastre um novo subgrupo de produtos.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subgroup-form-name">Nome *</Label>
            <Input id="subgroup-form-name" placeholder="Ex: Acessórios" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subgroup-form-description">Descrição</Label>
            <Input id="subgroup-form-description" placeholder="Descrição opcional" {...form.register('description')} />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="subgroup-form-active">Ativo</Label>
              <p className="text-xs text-muted-foreground">Subgrupo disponível para novos produtos</p>
            </div>
            <Switch
              id="subgroup-form-active"
              checked={isActive}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (subgroup ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)}
              {subgroup ? 'Salvar' : 'Criar subgrupo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
