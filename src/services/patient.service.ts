import { Gender } from '@prisma/client'
import type { ServiceResult } from '@/types'
import { encrypt, decrypt } from '@/lib/encryption'
import { prisma } from '@/lib/db'

interface CreatePatientInput {
  full_name: string
  staff_code: string
  age: number
  gender: string
  department: string
  company_name: string
  complaints: string
  diagnosis: string
  treatment: string
  attending_medic_id: string
  vital_signs?: {
    blood_pressure?: string
    pulse_rate?: number
    temperature?: number
    respiratory_rate?: number
    oxygen_saturation?: number
    weight?: number
    height?: number
    BMI?: number
  }
  drugs_dispensed?: { drug_id?: string; drug_name?: string; quantity_dispensed: number; unit?: string }[]
}

function calculateBMI(weight?: number, height?: number): number | undefined {
  if (weight && height && height > 0) {
    return Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10
  }
  return undefined
}

export async function create(input: CreatePatientInput): Promise<ServiceResult<{ patient_id: string }>> {
  try {
    const bmi = calculateBMI(input.vital_signs?.weight, input.vital_signs?.height)
    const vitalSigns = input.vital_signs ? { ...input.vital_signs, BMI: bmi } : undefined

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.patientRecord.create({
        data: {
          full_name: encrypt(input.full_name),
          staff_code: input.staff_code,
          age: input.age,
          gender: input.gender as Gender,
          department: input.department,
          company_name: input.company_name,
          date_of_visit: new Date(),
          time_of_visit: new Date(),
          complaints: encrypt(input.complaints),
          diagnosis: encrypt(input.diagnosis),
          treatment: encrypt(input.treatment),
          attending_medic_id: input.attending_medic_id,
          vital_signs: vitalSigns ?? undefined,
          drugs_dispensed: input.drugs_dispensed ?? [],
        },
      })

      if (input.drugs_dispensed?.length) {
        for (const drug of input.drugs_dispensed) {
          if (!drug.drug_id) continue
          const updated = await tx.drugInventory.update({
            where: { drug_id: drug.drug_id, quantity_in_stock: { gte: drug.quantity_dispensed } },
            data: { quantity_in_stock: { decrement: drug.quantity_dispensed } },
          })
          if (updated.quantity_in_stock < 0) {
            throw new Error(`Insufficient stock for drug: ${drug.drug_name}`)
          }
        }
      }

      return record
    })

    return { success: true, data: { patient_id: result.patient_id } }
  } catch {
    return { success: false, error: 'Could not save patient record.', code: 'PATIENT_CREATE_FAILED' }
  }
}

export async function listByCompany(company_name: string, medic_id?: string): Promise<ServiceResult<Record<string, unknown>[]>> {
  try {
    const where: Record<string, unknown> = { company_name }
    if (medic_id) where.attending_medic_id = medic_id
    const records = await prisma.patientRecord.findMany({ where, orderBy: { created_at: 'desc' } })
    
    const decryptedRecords = records.map(record => ({
      ...record,
      full_name: decrypt(record.full_name),
      complaints: decrypt(record.complaints),
      diagnosis: decrypt(record.diagnosis),
      treatment: decrypt(record.treatment),
    }))

    return { success: true, data: decryptedRecords }
  } catch {
    return { success: false, error: 'Could not fetch records.', code: 'PATIENT_LIST_FAILED' }
  }
}

export async function getById(patient_id: string, company_name: string): Promise<ServiceResult<Record<string, unknown>>> {
  try {
    const record = await prisma.patientRecord.findFirst({
      where: { patient_id, company_name },
    })
    if (!record) return { success: false, error: 'Patient record not found.', code: 'PATIENT_NOT_FOUND' }

    return {
      success: true,
      data: {
        ...record,
        full_name: decrypt(record.full_name),
        complaints: decrypt(record.complaints),
        diagnosis: decrypt(record.diagnosis),
        treatment: decrypt(record.treatment),
      },
    }
  } catch {
    return { success: false, error: 'Could not fetch record.', code: 'PATIENT_FETCH_FAILED' }
  }
}

export async function archivePatient(patient_id: string, company_name: string): Promise<ServiceResult<void>> {
  try {
    await prisma.patientRecord.updateMany({
      where: { patient_id, company_name },
      data: { status: 'Archived' },
    })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Could not archive record.', code: 'PATIENT_ARCHIVE_FAILED' }
  }
}
