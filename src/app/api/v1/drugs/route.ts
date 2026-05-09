import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { listByCompany } from '@/services/drug.service'
import { prisma } from '@/lib/db'
import { DrugCreateSchema } from '@/lib/validation/drug'

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
    const parsed = DrugCreateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid input.' }, { status: 422 })
    }
    const drug = await prisma.drugInventory.create({
      data: { ...parsed.data, company_name: user.company_name },
    })
    return Response.json({ success: true, data: drug }, { status: 201 })
  } catch (err) {
    return handleRouteError(err)
  }
}
