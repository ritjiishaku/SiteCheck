import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { list } from '@/services/audit.service'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['SuperAdmin'])

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit')) || 50
    const offset = Number(url.searchParams.get('offset')) || 0
    const company = url.searchParams.get('company') || undefined

    const result = await list(company, limit, offset)
    return Response.json({ success: true, ...result })
  } catch (err) {
    return handleRouteError(err)
  }
}
