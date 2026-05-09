import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { create, listByCompany } from '@/services/patient.service'
import { log } from '@/services/audit.service'
import { PatientInputSchema } from '@/lib/validation/patient'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Medic', 'Manager', 'Admin', 'SuperAdmin'])
    const medicId = user.role === 'Medic' ? user.medic_id : undefined
    const result = await listByCompany(user.company_name, medicId)
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Medic', 'Admin'])
    const body = await req.json()

    const parsed = PatientInputSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 422 })
    }

    const result = await create({ ...parsed.data, attending_medic_id: user.medic_id, company_name: user.company_name })
    if (result.success) {
      await log({
        performed_by: user.medic_id,
        action: 'Created patient record',
        target_record_id: result.data.patient_id,
        target_record_type: 'PatientRecord',
      })
    }
    return Response.json(result, { status: result.success ? 201 : 422 })
  } catch (err) {
    return handleRouteError(err)
  }
}
