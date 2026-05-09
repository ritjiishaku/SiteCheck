import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { restockDrug } from '@/services/drug.service'
import { log } from '@/services/audit.service'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth(req)
    await requireRole(user, ['Admin'])
    const body = await req.json()
    const quantity = Number(body.quantity)
    if (!quantity || quantity < 1) {
      return Response.json({ success: false, error: 'Quantity must be at least 1.' }, { status: 422 })
    }
    const result = await restockDrug(id, user.company_name, quantity)
    if (result.success) {
      await log({
        performed_by: user.medic_id,
        action: `Restocked drug (+${quantity} units)`,
        target_record_id: id,
        target_record_type: 'DrugInventory',
      })
    }
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}
