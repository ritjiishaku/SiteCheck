import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateEmailHash(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

async function main() {
  const email = 'admin@sitecheck.ng'
  const emailHash = generateEmailHash(email)

  const existing = await prisma.medicProfile.findUnique({
    where: { email_hash: emailHash },
  })

  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin123!', 12)
    await prisma.medicProfile.create({
      data: {
        full_name: 'System Administrator',
        email,
        email_hash: emailHash,
        password_hash: passwordHash,
        role: 'SuperAdmin',
        company_name: 'SiteCheck',
        is_active: true,
      },
    })
    console.log('SuperAdmin seeded (email: admin@sitecheck.ng, password: Admin123!).')
  } else {
    console.log('SuperAdmin already exists. Skipping.')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
