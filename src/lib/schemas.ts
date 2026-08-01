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
