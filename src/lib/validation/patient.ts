import { z } from 'zod'

export const PatientInputSchema = z.object({
  full_name: z.string().min(2).max(100),
  staff_code: z.string().min(1),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  department: z.string().max(100),
  complaints: z.string().max(2000),
  diagnosis: z.string().max(2000),
  treatment: z.string().max(2000),
  date_of_visit: z.string(),
  time_of_visit: z.string(),
  vital_signs: z.object({
    blood_pressure: z.string().optional(),
    pulse_rate: z.number().optional(),
    temperature: z.number().optional(),
    respiratory_rate: z.number().optional(),
    oxygen_saturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    BMI: z.number().optional(),
  }).optional(),
  drugs_dispensed: z.array(z.object({
    drug_id: z.string().optional(),
    drug_name: z.string(),
    quantity_dispensed: z.number().int().positive(),
    unit: z.string(),
  })).optional(),
})

export type CreatePatientInput = z.infer<typeof PatientInputSchema>
