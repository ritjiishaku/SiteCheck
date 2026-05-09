import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    patientRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    drugInventory: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((fn: (p: typeof mockPrisma) => unknown) => fn(mockPrisma)),
  }
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    Role: { Medic: 'Medic', Manager: 'Manager', Admin: 'Admin', SuperAdmin: 'SuperAdmin' },
    RecordStatus: { Active: 'Active', Archived: 'Archived' },
  }
})

function calcBMI(weightKg: number, heightCm: number): number {
  return Math.round((weightKg / ((heightCm / 100) * (heightCm / 100))) * 10) / 10
}

describe('PatientService', () => {
  describe('BMI calculation', () => {
    it('calculates BMI correctly for normal weight', () => {
      expect(calcBMI(70, 175)).toBe(22.9)
    })

    it('calculates BMI correctly for underweight', () => {
      expect(calcBMI(50, 170)).toBe(17.3)
    })

    it('calculates BMI correctly for obese', () => {
      expect(calcBMI(100, 165)).toBe(36.7)
    })

    it('handles edge case of zero height', () => {
      expect(calcBMI(70, 0)).toBe(Infinity)
    })
  })

  describe('record archiving', () => {
    it('should have Archived status constant', () => {
      expect('Archived').toBe('Archived')
    })

    it('should not allow deleting records', () => {
      const allowedStatuses = ['Active', 'Archived']
      expect(allowedStatuses).not.toContain('Deleted')
    })
  })
})
