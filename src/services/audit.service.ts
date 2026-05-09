import { prisma } from '@/lib/db'

interface AuditInput {
  performed_by: string
  action: string
  target_record_id?: string
  target_record_type?: string
  ip_address?: string
  device_info?: string
}

export async function log(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      performed_by: input.performed_by,
      action: input.action,
      target_record_id: input.target_record_id,
      target_record_type: input.target_record_type,
      ip_address: input.ip_address,
      device_info: input.device_info,
    },
  })
}

export async function list(company_name?: string, limit = 50, offset = 0) {
  const where: Record<string, unknown> = {}
  if (company_name) {
    const medics = await prisma.medicProfile.findMany({
      where: { company_name },
      select: { medic_id: true },
    })
    where.performed_by = { in: medics.map((m) => m.medic_id) }
  }
  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: { performer: { select: { full_name: true, email: true, company_name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])
  return { entries, total }
}
