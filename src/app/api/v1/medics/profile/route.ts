import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Medic', 'Manager', 'Admin', 'SuperAdmin'])

    const body = await req.json()

    const allowed: Record<string, unknown> = {}
    if (typeof body.site_location === 'string') allowed.site_location = body.site_location

    if (Object.keys(allowed).length === 0) {
      return Response.json({ success: false, error: 'No valid fields to update.' }, { status: 422 })
    }

    const updated = await prisma.medicProfile.update({
      where: { medic_id: user.medic_id },
      data: allowed,
      select: { medic_id: true, site_location: true },
    })

    return Response.json({ success: true, data: updated })
  } catch (err) {
    return handleRouteError(err)
  }
}
