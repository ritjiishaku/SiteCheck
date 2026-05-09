import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { getSubscriptionStatus } from '@/services/payment.service'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Admin', 'SuperAdmin', 'Manager'])

    const result = await getSubscriptionStatus(user.company_name)
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}
