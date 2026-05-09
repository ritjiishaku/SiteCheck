import { PrismaClient, Role } from '@prisma/client'
import { sign } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000

function generateEmailHash(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export async function login(email: string, password: string): Promise<{ token: string; refreshToken: string }> {
  const emailHash = generateEmailHash(email)
  const user = await prisma.medicProfile.findUnique({ where: { email_hash: emailHash } })
  if (!user) throw new Error('Invalid email or password.')

  if (user.locked_until && user.locked_until > new Date()) {
    const minutes = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000)
    throw new Error(`Account temporarily locked. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    const attempts = user.failed_login_attempts + 1
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await prisma.medicProfile.update({
        where: { email_hash: emailHash },
        data: { failed_login_attempts: attempts, locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS) },
      })
      throw new Error('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.')
    }
    await prisma.medicProfile.update({
      where: { email_hash: emailHash },
      data: { failed_login_attempts: attempts },
    })
    throw new Error('Invalid email or password.')
  }

  await prisma.medicProfile.update({
    where: { email_hash: emailHash },
    data: { failed_login_attempts: 0, locked_until: null, last_login: new Date() },
  })

  const secret = process.env.JWT_SECRET!
  const token = sign(
    { medic_id: user.medic_id, role: user.role, company_name: user.company_name },
    secret,
    { expiresIn: 600 }
  )
  const refreshToken = sign({ medic_id: user.medic_id }, secret, { expiresIn: 604800 })
  return { token, refreshToken }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function signup(input: {
  full_name: string
  email: string
  phone_number?: string
  company_name: string
  role: string
  password: string
}): Promise<{ token: string; refreshToken: string }> {
  const emailHash = generateEmailHash(input.email)
  const existing = await prisma.medicProfile.findUnique({ where: { email_hash: emailHash } })
  if (existing) throw new Error('An account with this email already exists.')

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.medicProfile.create({
    data: {
      full_name: input.full_name,
      email: input.email,
      email_hash: emailHash,
      password_hash: passwordHash,
      phone_number: input.phone_number || null,
      company_name: input.company_name,
      role: input.role as Role,
    },
  })

  const secret = process.env.JWT_SECRET!
  const token = sign(
    { medic_id: user.medic_id, role: user.role, company_name: user.company_name },
    secret,
    { expiresIn: 600 }
  )
  const refreshToken = sign({ medic_id: user.medic_id }, secret, { expiresIn: 604800 })
  return { token, refreshToken }
}

export async function generateResetToken(email: string): Promise<string> {
  const emailHash = generateEmailHash(email)
  const user = await prisma.medicProfile.findUnique({ where: { email_hash: emailHash } })
  if (!user) return ''

  const secret = process.env.JWT_SECRET!
  const resetToken = sign({ medic_id: user.medic_id, purpose: 'password_reset' }, secret, { expiresIn: 3600 })
  return resetToken
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const { verify } = await import('jsonwebtoken')
  const secret = process.env.JWT_SECRET!
  let payload: { medic_id: string; purpose: string }
  try {
    payload = verify(token, secret) as typeof payload
  } catch {
    throw new Error('Invalid or expired reset token.')
  }
  if (payload.purpose !== 'password_reset') throw new Error('Invalid reset token.')

  const passwordHash = await hashPassword(newPassword)
  await prisma.medicProfile.update({
    where: { medic_id: payload.medic_id },
    data: { password_hash: passwordHash },
  })
}
