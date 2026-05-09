import { z } from 'zod'

export const InitiatePaymentSchema = z.object({
  plan: z.enum(['Monthly', 'Quarterly', 'Annual']),
  amount_ngn: z.number().int().positive(),
  email: z.string().email(),
})

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>
