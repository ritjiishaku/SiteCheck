import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Admin', 'SuperAdmin'])

    const where: Record<string, unknown> = {}
    if (user.role !== 'SuperAdmin') {
      where.company_name = user.company_name
    }

    const medics = await prisma.medicProfile.findMany({
      where,
      orderBy: { full_name: 'asc' },
      select: {
        medic_id: true,
        full_name: true,
        email: true,
        role: true,
        company_name: true,
        is_active: true,
        created_at: true,
        last_login: true,
      },
    })

    return Response.json({ success: true, data: medics })
  } catch (err) {
    return handleRouteError(err)
  }
}
