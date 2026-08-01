import { z } from 'zod';

export const costComponentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  description: z.string().max(500, 'Máximo de 500 caracteres').optional().or(z.literal('')),
  type: z.enum(['FIXED', 'PERCENT', 'PER_ORDER', 'MONTHLY']),
  category: z.enum(['PACKAGING', 'TAX', 'FEE', 'SHIPPING', 'OPERATIONAL', 'MARKETING', 'OTHER']).default('OTHER'),
  value: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  calculation_base: z.enum(['PRICE', 'COST']).optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENT' && data.calculation_base === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['calculation_base'],
      message: 'Base de cálculo é obrigatória para componentes percentuais',
    });
  }
});

export type CostComponentFormValues = z.infer<typeof costComponentSchema>;

export const externalSaleSchema = z.object({
  customer_name: z.string().min(1, 'Nome do cliente é obrigatório').max(255),
  customer_email: z.string().email('Email inválido').optional().or(z.literal('')),
  items: z.array(z.object({
    variant_id: z.string().min(1, 'Selecione uma variante'),
    quantity: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.coerce.number({ invalid_type_error: 'Quantidade inválida' }).int('Quantidade inválida').positive('Quantidade deve ser ao menos 1')
    ),
    unit_price: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.coerce.number({ invalid_type_error: 'Preço inválido' }).min(0, 'Preço não pode ser negativo')
    ),
  })).min(1, 'Adicione ao menos um item'),
  discount_amount: z.coerce.number().min(0).optional(),
  payment_method: z.string().optional(),
  gateway: z.string().optional(),
  payment_installments: z.coerce.number().int().positive().optional(),
  shipping_cost_owner: z.coerce.number().min(0).optional(),
  shipping_cost_customer: z.coerce.number().min(0).optional(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED']).default('PAID'),
});

export type ExternalSaleFormValues = z.infer<typeof externalSaleSchema>;
