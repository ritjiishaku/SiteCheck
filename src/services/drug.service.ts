import type { DrugInventory } from '@prisma/client'
import type { ServiceResult } from '@/types'
import { prisma } from '@/lib/db'

export async function deductStock(drugId: string, quantity: number): Promise<ServiceResult<{ quantity_in_stock: number }>> {
  try {
    const drug = await prisma.drugInventory.findUnique({ where: { drug_id: drugId } })
    if (!drug) return { success: false, error: 'Drug not found.', code: 'DRUG_NOT_FOUND' }
    if (drug.quantity_in_stock < quantity) {
      return { success: false, error: 'Insufficient stock.', code: 'INSUFFICIENT_STOCK' }
    }
    const updated = await prisma.drugInventory.update({
      where: { drug_id: drugId },
      data: { quantity_in_stock: { decrement: quantity } },
    })
    return { success: true, data: { quantity_in_stock: updated.quantity_in_stock } }
  } catch {
    return { success: false, error: 'Could not update stock.', code: 'STOCK_UPDATE_FAILED' }
  }
}

export async function listByCompany(company_name: string): Promise<ServiceResult<DrugInventory[]>> {
  try {
    const drugs = await prisma.drugInventory.findMany({
      where: { company_name, is_archived: false },
      orderBy: { drug_name: 'asc' },
    })
    return { success: true, data: drugs }
  } catch {
    return { success: false, error: 'Could not fetch drugs.', code: 'DRUG_LIST_FAILED' }
  }
}

export async function updateDrug(drugId: string, company_name: string, data: Record<string, unknown>): Promise<ServiceResult<DrugInventory>> {
  try {
    const drug = await prisma.drugInventory.update({
      where: { drug_id: drugId, company_name },
      data,
    })
    return { success: true, data: drug }
  } catch {
    return { success: false, error: 'Could not update drug.', code: 'DRUG_UPDATE_FAILED' }
  }
}

export async function archiveDrug(drugId: string): Promise<ServiceResult<void>> {
  try {
    await prisma.drugInventory.update({
      where: { drug_id: drugId },
      data: { is_archived: true },
    })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Could not archive drug.', code: 'DRUG_ARCHIVE_FAILED' }
  }
}

export async function removeDrug(drugId: string): Promise<ServiceResult<void>> {
  return archiveDrug(drugId)
}

export async function restockDrug(drugId: string, company_name: string, quantity: number): Promise<ServiceResult<DrugInventory>> {
  try {
    const drug = await prisma.drugInventory.update({
      where: { drug_id: drugId, company_name },
      data: {
        quantity_in_stock: { increment: quantity },
        last_restocked_at: new Date(),
      },
    })
    return { success: true, data: drug }
  } catch {
    return { success: false, error: 'Could not restock drug.', code: 'DRUG_RESTOCK_FAILED' }
  }
}
