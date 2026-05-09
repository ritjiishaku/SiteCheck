import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { getById, archivePatient } from '@/services/patient.service'
import { log } from '@/services/audit.service'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth(req)
    await requireRole(user, ['Medic', 'Manager', 'Admin', 'SuperAdmin'])
    const result = await getById(id, user.company_name)
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth(req)
    await requireRole(user, ['Admin'])
    const body = await req.json()

    if (body.status === 'Archived') {
      const result = await archivePatient(id, user.company_name)
      if (result.success) {
        await log({
          performed_by: user.medic_id,
          action: 'Archived patient record',
          target_record_id: id,
          target_record_type: 'PatientRecord',
        })
      }
      return Response.json(result)
    }

    return Response.json({ success: false, error: 'Invalid action.' }, { status: 422 })
  } catch (err) {
    return handleRouteError(err)
  }
}
