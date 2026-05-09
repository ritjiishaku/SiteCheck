import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    medicProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    Role: { Medic: 'Medic', Manager: 'Manager', Admin: 'Admin', SuperAdmin: 'SuperAdmin' },
  }
})

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
  compare: vi.fn(),
  hash: vi.fn(),
}))

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(() => 'mock-token') },
  sign: vi.fn(() => 'mock-token'),
}))

import { login } from '../auth.service'
import bcrypt from 'bcryptjs'

function mockUser(overrides = {}) {
  return {
    medic_id: 'u1',
    email_hash: 'abc123',
    password_hash: '$2a$12$hashed',
    role: 'Medic',
    company_name: 'Test Co',
    failed_login_attempts: 0,
    locked_until: null,
    ...overrides,
  }
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login — brute force protection', () => {
    it('rejects login when account is locked', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())
      const future = new Date(Date.now() + 300000)

      vi.mocked(prisma.medicProfile.findUnique).mockResolvedValue(mockUser({ locked_until: future }))

      await expect(login('test@co.ng', 'any-password')).rejects.toThrow('Account temporarily locked')
    })

    it('locks account after 5 failed attempts', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.medicProfile.findUnique).mockResolvedValue(mockUser({ failed_login_attempts: 4 }))
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
      vi.mocked(prisma.medicProfile.update).mockResolvedValue(mockUser())

      await expect(login('test@co.ng', 'wrong-password')).rejects.toThrow('locked')
      expect(prisma.medicProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failed_login_attempts: 5, locked_until: expect.any(Date) }),
        })
      )
    })

    it('resets attempt counter on successful login', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.medicProfile.findUnique).mockResolvedValue(mockUser({ failed_login_attempts: 2 }))
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(prisma.medicProfile.update).mockResolvedValue(mockUser())

      const result = await login('test@co.ng', 'correct-password')
      expect(result.token).toBe('mock-token')
      expect(prisma.medicProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failed_login_attempts: 0, locked_until: null }),
        })
      )
    })
  })
})
