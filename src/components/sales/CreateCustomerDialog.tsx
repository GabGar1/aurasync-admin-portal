import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { customersApi, getFriendlyError } from '@/services/api';
import { customerCreateSchema, type CustomerCreateFormValues } from '@/lib/schemas';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Customer } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}

export default function CreateCustomerDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient();
  const form = useForm<CustomerCreateFormValues>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: { name: '', email: '', city: '', province: '' },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: (payload: CustomerCreateFormValues) => customersApi.create({
      name: payload.name.trim(),
      email: payload.email?.trim() ? payload.email.trim() : undefined,
      city: payload.city?.trim() ? payload.city.trim() : undefined,
      province: payload.province?.trim() ? payload.province.trim() : undefined,
    }),
    onSuccess: (customer) => {
      toast.success('Cliente criado com sucesso');
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['external-sales-customers'] });
      onCreated(customer);
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(
      `Falha ao criar cliente: ${getFriendlyError(err)}`
    ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar cliente</DialogTitle>
          <DialogDescription>Cadastre um novo cliente para usar nesta venda.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="new-customer-name">Nome *</Label>
            <Input id="new-customer-name" placeholder="Nome do cliente" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-customer-email">Email</Label>
            <Input id="new-customer-email" type="email" placeholder="email@exemplo.com" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="new-customer-city">Cidade</Label>
              <Input id="new-customer-city" placeholder="Cidade" {...form.register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-customer-province">UF</Label>
              <Input id="new-customer-province" placeholder="UF" {...form.register('province')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
