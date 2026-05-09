import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { updateDrug, archiveDrug } from '@/services/drug.service'
import { log } from '@/services/audit.service'
import { DrugUpdateSchema } from '@/lib/validation/drug'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth(req)
    await requireRole(user, ['Admin'])
    const body = await req.json()
    const parsed = DrugUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 422 })
    }
    const result = await updateDrug(id, user.company_name, parsed.data)
    if (result.success) {
      await log({
        performed_by: user.medic_id,
        action: 'Updated drug',
        target_record_id: id,
        target_record_type: 'DrugInventory',
      })
    }
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth(req)
    await requireRole(user, ['Admin'])
    const result = await archiveDrug(id)
    if (result.success) {
      await log({
        performed_by: user.medic_id,
        action: 'Archived drug',
        target_record_id: id,
        target_record_type: 'DrugInventory',
      })
    }
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}
