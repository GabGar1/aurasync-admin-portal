import { z } from 'zod';

export const costComponentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  description: z.string().max(500, 'Máximo de 500 caracteres').optional().or(z.literal('')),
  type: z.enum(['FIXED', 'PERCENT', 'PER_ORDER', 'PACKAGING', 'MONTHLY_FIXED', 'MONTHLY_PERCENT']),
  category: z.enum(['PACKAGING', 'TAX', 'FEE', 'SHIPPING', 'OPERATIONAL', 'MARKETING', 'OTHER', 'ACQUISITION', 'CREDIT_FEE']).default('OTHER'),
  value: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  calculation_base: z.enum(['PRICE', 'COST']).optional(),
  is_active: z.boolean().default(true),
  max_products_per_package: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.coerce.number({ invalid_type_error: 'Capacidade inválida' }).int('Capacidade inválida').positive('Capacidade deve ser positiva').optional()
  ),
  consolidates: z.boolean().default(false),
  allocation_basis: z.enum(['PER_ORDER', 'PER_PRODUCT']).optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)').optional().or(z.literal('')),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)').optional().or(z.literal('')),
  applies_to_fair_only: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENT' && data.calculation_base === undefined) {
    ctx.addIssue({ code: 'custom', path: ['calculation_base'], message: 'Base de cálculo é obrigatória para componentes percentuais' });
  }
  if (data.type === 'MONTHLY_FIXED' && data.allocation_basis === undefined) {
    ctx.addIssue({ code: 'custom', path: ['allocation_basis'], message: 'Base de rateio é obrigatória para componentes mensais fixos' });
  }
  if (data.type === 'PACKAGING' && data.max_products_per_package === undefined) {
    ctx.addIssue({ code: 'custom', path: ['max_products_per_package'], message: 'Capacidade por caixa é obrigatória para embalagens' });
  }
});

export type CostComponentFormValues = z.infer<typeof costComponentSchema>;

export const productSubgroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  description: z.string().max(500, 'Máximo de 500 caracteres').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export type ProductSubgroupFormValues = z.infer<typeof productSubgroupSchema>;

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
  is_fair: z.boolean().optional().default(false),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED']).default('PAID'),
});

export type ExternalSaleFormValues = z.infer<typeof externalSaleSchema>;

export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  city: z.string().max(255).optional(),
  province: z.string().max(10).optional(),
});

export type CustomerCreateFormValues = z.infer<typeof customerCreateSchema>;

export const storedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN']),
  status: z.boolean(),
  created_at: z.string(),
});
