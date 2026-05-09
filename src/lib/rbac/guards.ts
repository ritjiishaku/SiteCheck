import type { MedicProfile, UserRole } from '@/types'

export class UnauthorizedError extends Error {
  statusCode = 401
  constructor() {
    super('You must be logged in.')
  }
}

export class ForbiddenError extends Error {
  statusCode = 403
  constructor() {
    super('Access denied.')
  }
}

export async function requireAuth(req: Request): Promise<MedicProfile> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError()
  }
  const token = authHeader.slice(7)
  const user = await verifyToken(token)
  if (!user) throw new UnauthorizedError()
  return user
}

export async function requireRole(user: MedicProfile, allowedRoles: UserRole[]): Promise<void> {
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new ForbiddenError()
  }
}

export function requireCompanyScope(user: MedicProfile, targetCompany: string): void {
  if (user.role === 'SuperAdmin') return
  if (user.company_name !== targetCompany) {
    throw new ForbiddenError()
  }
}

async function verifyToken(token: string): Promise<MedicProfile | null> {
  const { verify } = await import('jsonwebtoken')
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  try {
    return verify(token, secret) as MedicProfile
  } catch {
    return null
  }
}
