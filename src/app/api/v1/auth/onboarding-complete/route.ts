import { requireAuth, requireRole } from '@/lib/rbac/guards'
import { handleRouteError } from '@/lib/api/error-handler'
import { hashPassword } from '@/services/auth.service'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const DEFAULT_TEMP_PASSWORD = 'Temp123!'

function generateEmailHash(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req)
    await requireRole(user, ['Medic', 'Manager', 'Admin'])

    const body = await req.json()
    const { company_name, site_location, team, drugs } = body

    if (company_name) {
      await prisma.medicProfile.update({
        where: { medic_id: user.medic_id },
        data: { company_name, site_location: site_location || null },
      })
    }

    if (team?.length) {
      const passwordHash = await hashPassword(DEFAULT_TEMP_PASSWORD)
      for (const member of team) {
        if (!member.name || !member.email) continue
        const emailHash = generateEmailHash(member.email)
        const existing = await prisma.medicProfile.findUnique({
          where: { email_hash: emailHash },
        })
        if (!existing) {
          await prisma.medicProfile.create({
            data: {
              full_name: member.name,
              email: member.email,
              email_hash: emailHash,
              password_hash: passwordHash,
              company_name: company_name || user.company_name,
              role: 'Medic',
              is_active: true,
            },
          })
        }
      }
    }

    if (drugs?.length) {
      for (const drug of drugs) {
        if (!drug.name) continue
        await prisma.drugInventory.create({
          data: {
            drug_name: drug.name,
            unit: drug.unit || 'tablets',
            company_name: company_name || user.company_name,
            quantity_in_stock: drug.quantity || 0,
            low_stock_threshold: 10,
          },
        })
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
