import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { listByCompany } from '@/services/drug.service'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Medic', 'Manager', 'Admin', 'SuperAdmin'])
    const result = await listByCompany(user.company_name)
    return Response.json(result)
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Admin'])
    const body = await req.json()
    const drug = await prisma.drugInventory.create({
      data: { ...body, company_name: user.company_name },
    })
    return Response.json({ success: true, data: drug }, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
