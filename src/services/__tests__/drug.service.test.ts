import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    drugInventory: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((fn: (p: typeof mockPrisma) => unknown) => fn(mockPrisma)),
  }
  return {
    PrismaClient: vi.fn(() => mockPrisma),
  }
})

import { deductStock, listByCompany, archiveDrug, restockDrug } from '../drug.service'

function mockDrug(overrides = {}) {
  return {
    drug_id: 'd1',
    drug_name: 'Paracetamol',
    category: 'analgesic',
    unit: 'tablets',
    company_name: 'Test Co',
    quantity_in_stock: 100,
    low_stock_threshold: 10,
    is_archived: false,
    cost_per_unit: 50,
    ...overrides,
  }
}

describe('DrugService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deductStock', () => {
    it('deducts stock successfully', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.drugInventory.findUnique).mockResolvedValue(mockDrug())
      vi.mocked(prisma.drugInventory.update).mockResolvedValue(mockDrug({ quantity_in_stock: 95 }))

      const result = await deductStock('d1', 5)
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity_in_stock).toBe(95)
    })

    it('rejects insufficient stock', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.drugInventory.findUnique).mockResolvedValue(mockDrug({ quantity_in_stock: 3 }))

      const result = await deductStock('d1', 5)
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe('INSUFFICIENT_STOCK')
    })

    it('rejects non-existent drug', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.drugInventory.findUnique).mockResolvedValue(null)

      const result = await deductStock('d-none', 5)
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe('DRUG_NOT_FOUND')
    })
  })

  describe('archiveDrug', () => {
    it('archives drug instead of deleting', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.drugInventory.update).mockResolvedValue(mockDrug({ is_archived: true }))

      const result = await archiveDrug('d1')
      expect(result.success).toBe(true)
      expect(prisma.drugInventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { drug_id: 'd1' },
          data: { is_archived: true },
        })
      )
    })
  })

  describe('listByCompany', () => {
    it('only returns non-archived drugs', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.drugInventory.findMany).mockResolvedValue([mockDrug()])

      await listByCompany('Test Co')
      expect(prisma.drugInventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { company_name: 'Test Co', is_archived: false },
        })
      )
    })
  })

  describe('restockDrug', () => {
    it('increments stock and updates restocked timestamp', async () => {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = vi.mocked(new PrismaClient())

      vi.mocked(prisma.drugInventory.update).mockResolvedValue(mockDrug({ quantity_in_stock: 150 }))

      const result = await restockDrug('d1', 'TestCo', 50)
      expect(result.success).toBe(true)
      expect(prisma.drugInventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { drug_id: 'd1', company_name: 'TestCo' },
          data: expect.objectContaining({
            quantity_in_stock: { increment: 50 },
            last_restocked_at: expect.any(Date),
          }),
        })
      )
    })
  })
})
