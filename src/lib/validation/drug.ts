import { z } from 'zod'

export const DrugCreateSchema = z.object({
  drug_name: z.string().min(1).max(100),
  category: z.string().max(50).optional(),
  unit: z.string().min(1).max(20),
  quantity_in_stock: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(10),
  cost_per_unit: z.number().int().min(0).optional(),
  expiry_date: z.string().optional(),
  supplier_name: z.string().max(100).optional(),
})

export const DrugUpdateSchema = z.object({
  drug_name: z.string().min(1).max(100).optional(),
  category: z.string().max(50).optional(),
  unit: z.string().min(1).max(20).optional(),
  quantity_in_stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  cost_per_unit: z.number().int().min(0).optional(),
  expiry_date: z.string().optional(),
  supplier_name: z.string().max(100).optional(),
})
