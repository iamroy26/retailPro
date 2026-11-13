import { z } from 'zod';

const optionalTrimmedText = (max) => z.string().trim().max(max).optional();
const finiteAmount = z.coerce.number().finite();

export const registerBody = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().pipe(z.email().max(254)).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(200),
});

export const loginBody = z.object({
  email: z.string().trim().pipe(z.email().max(254)).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
});

export const saleBody = z.object({
  items: z.array(z.object({
    product_id: z.string().trim().min(1).max(80),
    quantity: z.coerce.number().finite().int().min(1),
  })).min(1).max(100),
  discount: finiteAmount.min(0).optional(),
  payment_method: z.enum(['cash', 'card', 'mobile_money']).optional(),
  amount_received: finiteAmount.min(0).optional(),
  payment_reference: optionalTrimmedText(120),
  customer_id: z.string().trim().min(1).max(80).optional(),
  customer_name: optionalTrimmedText(160),
  notes: optionalTrimmedText(1000),
  tax_rate: finiteAmount.min(0).max(100).optional(),
  total_hint: finiteAmount.min(0).optional(),
});

export const stockAdjustmentBody = z.object({
  product_id: z.string().trim().min(1).max(80),
  mode: z.enum(['set', 'delta']).optional(),
  quantity: finiteAmount,
  reason: z.string().trim().min(3).max(500),
  type: z.enum(['purchase', 'adjustment', 'return', 'damage']).optional(),
  reference: optionalTrimmedText(80),
  supplier_id: z.string().trim().min(1).max(80).optional(),
});

export const reportQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().int().min(1).max(366).optional(),
  low_stock_threshold: z.coerce.number().finite().min(0).optional(),
});
