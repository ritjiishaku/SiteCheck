import { requireAuth } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const tokenUser = await requireAuth(req)
    const user = await prisma.medicProfile.findUnique({
      where: { medic_id: tokenUser.medic_id },
      select: {
        medic_id: true,
        full_name: true,
        email: true,
        role: true,
        company_name: true,
        site_location: true,
        is_active: true,
      },
    })
    if (!user) {
      return Response.json({ success: false, error: 'User not found.' }, { status: 404 })
    }
    return Response.json({ success: true, data: user })
  } catch (err) {
    return handleRouteError(err)
  }
}
