'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { StockBadge } from '@/components/ui/StockBadge'
import { Button } from '@/components/ui/Button'
import { SkeletonStatGrid, Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { Search, Plus, AlertTriangle, Package, Clock, Edit3, Trash2, RefreshCw, X } from 'lucide-react'
import { useAuthGuard } from '@/hooks/useAuthGuard'

interface Drug {
  drug_id: string
  drug_name: string
  category: string
  unit: string
  quantity_in_stock: number
  low_stock_threshold: number
  cost_per_unit: number | null
  expiry_date: string | null
  supplier_name: string | null
}

interface UserProfile {
  medic_id: string
  full_name: string
  role: string
  company_name: string
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d < new Date() && !isNaN(d.getTime())
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB')
}

const ITEMS_PER_PAGE = 10

export default function DrugsPage() {
  useAuthGuard(['Medic', 'Manager', 'Admin', 'SuperAdmin'])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'restock' | null>(null)
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  async function fetchDrugs() {
    const token = localStorage.getItem('token')
    if (!token) return
    const res = await fetch('/api/v1/drugs', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.success) setDrugs(data.data || [])
  }

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const [meRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetchDrugs(),
        ])
        const meData = await meRes.json()
        if (meData.success) setUser(meData.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'
  const userName = user?.full_name || 'Loading...'
  const userRole = user?.role || 'Manager'

  const filtered = drugs.filter((d) =>
    d.drug_name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const totalItems = drugs.reduce((s, d) => s + d.quantity_in_stock, 0)
  const lowCount = drugs.filter((d) => d.quantity_in_stock > 0 && d.quantity_in_stock <= d.low_stock_threshold).length
  const criticalCount = drugs.filter((d) => d.quantity_in_stock === 0).length
  const expiredCount = drugs.filter((d) => isExpired(d.expiry_date)).length

  const inputClass = 'w-full px-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25'

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setModalLoading(true)
    const form = new FormData(e.currentTarget)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/v1/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          drug_name: form.get('drug_name'),
          category: form.get('category'),
          unit: form.get('unit') || 'tablets',
          quantity_in_stock: Number(form.get('quantity_in_stock')) || 0,
          low_stock_threshold: Number(form.get('low_stock_threshold')) || 10,
          cost_per_unit: Number(form.get('cost_per_unit')) || null,
          expiry_date: form.get('expiry_date') ? new Date(form.get('expiry_date') as string).toISOString() : null,
          supplier_name: form.get('supplier_name'),
        }),
      })
      if (res.ok) {
        setShowModal(null)
        await fetchDrugs()
      }
    } catch {
      // silent
    } finally {
      setModalLoading(false)
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedDrug) return
    setModalLoading(true)
    const form = new FormData(e.currentTarget)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/drugs/${selectedDrug.drug_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          drug_name: form.get('drug_name'),
          category: form.get('category'),
          unit: form.get('unit'),
          low_stock_threshold: Number(form.get('low_stock_threshold')) || 10,
          cost_per_unit: Number(form.get('cost_per_unit')) || null,
          expiry_date: form.get('expiry_date') ? new Date(form.get('expiry_date') as string).toISOString() : null,
          supplier_name: form.get('supplier_name'),
        }),
      })
      if (res.ok) {
        setShowModal(null)
        setSelectedDrug(null)
        await fetchDrugs()
      }
    } catch {
      // silent
    } finally {
      setModalLoading(false)
    }
  }

  async function handleRestock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedDrug) return
    setModalLoading(true)
    const form = new FormData(e.currentTarget)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/drugs/${selectedDrug.drug_id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: Number(form.get('quantity')) }),
      })
      if (res.ok) {
        setShowModal(null)
        setSelectedDrug(null)
        await fetchDrugs()
      }
    } catch {
      // silent
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete(drug: Drug) {
    if (!confirm(`Delete ${drug.drug_name}? This cannot be undone.`)) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/drugs/${drug.drug_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await fetchDrugs()
    } catch {
      // silent
    }
  }

  function openEdit(drug: Drug) {
    setSelectedDrug(drug)
    setShowModal('edit')
  }

  function openRestock(drug: Drug) {
    setSelectedDrug(drug)
    setShowModal('restock')
  }

  return (
    <DashboardLayout title="Drug Inventory" medicName={userName} role={userRole}>
      {loading ? (
        <div className="flex flex-col gap-6">
          <SkeletonStatGrid count={4} />
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-72 rounded-sm" />
            <Skeleton className="h-12 w-32 rounded-sm ml-auto" />
          </div>
          <SkeletonTable rows={8} cols={7} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Total items</p>
                  <p className="text-headline-md font-bold text-neutral-900">{totalItems}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-tertiary-500" />
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Low stock</p>
                  <p className="text-headline-md font-bold text-tertiary-500">{lowCount}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-error" />
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Critical</p>
                  <p className="text-headline-md font-bold text-error">{criticalCount}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-tertiary-500" />
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Expired</p>
                  <p className="text-headline-md font-bold text-tertiary-500">{expiredCount}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search drugs..." className="w-full pl-10 pr-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25" />
            </div>
            {isAdmin && (
              <Button label="Add drug" onClick={() => setShowModal('add')}>
                <Plus className="h-4 w-4" /> Add drug
              </Button>
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-primary-900 text-white text-body-md font-semibold">
                    <th className="text-left px-6 py-3">Drug</th>
                    <th className="text-left px-6 py-3">Category</th>
                    <th className="text-left px-6 py-3">Unit</th>
                    <th className="text-left px-6 py-3">Quantity</th>
                    <th className="text-left px-6 py-3">Expiry</th>
                    <th className="text-left px-6 py-3">Status</th>
                    {isAdmin && <th className="text-left px-6 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-body-md text-neutral-400">
                        {search ? 'No drugs match your search.' : 'No drugs in inventory. Add your first drug to get started.'}
                      </td>
                    </tr>
                  ) : (
                    paged.map((drug, i) => (
                      <tr key={drug.drug_id} className={`text-body-md ${i % 2 === 0 ? 'bg-transparent' : 'bg-sand-50'} hover:bg-primary-50 transition-colors`}>
                        <td className="px-6 py-3 text-neutral-900 font-medium">{drug.drug_name}</td>
                        <td className="px-6 py-3 text-neutral-500 capitalize">{drug.category || '—'}</td>
                        <td className="px-6 py-3 text-neutral-500">{drug.unit}</td>
                        <td className="px-6 py-3 text-neutral-700">{drug.quantity_in_stock}</td>
                        <td className={`px-6 py-3 ${isExpired(drug.expiry_date) ? 'text-error font-semibold' : 'text-neutral-500'}`}>
                          {formatDate(drug.expiry_date)}
                          {isExpired(drug.expiry_date) && ' (Expired)'}
                        </td>
                        <td className="px-6 py-3">
                          <StockBadge quantity={drug.quantity_in_stock} threshold={drug.low_stock_threshold} />
                        </td>
                        {isAdmin && (
                          <td className="px-2 sm:px-6 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openRestock(drug)} aria-label="Restock"
                                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-primary-500 hover:bg-primary-50 rounded-sm transition-colors">
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button onClick={() => openEdit(drug)} aria-label="Edit"
                                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-500 hover:bg-primary-50 rounded-sm transition-colors">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(drug)} aria-label="Delete"
                                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-error hover:bg-error-bg rounded-sm transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-body-sm text-neutral-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-sm border border-neutral-100 bg-white hover:bg-sand-50 disabled:opacity-40 transition-colors">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-sm border border-neutral-100 bg-white hover:bg-sand-50 disabled:opacity-40 transition-colors">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {showModal === 'add' && (
        <div className="fixed inset-0 z-[999] bg-black/30 flex items-end sm:items-center justify-center overscroll-contain" onClick={() => setShowModal(null)}>
          <div className="bg-sand-50 rounded-t-lg sm:rounded-lg p-6 shadow-xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain safe-area-bottom animate-[slideUp_200ms_ease-out] sm:animate-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md font-semibold text-neutral-900">Add Drug</h3>
              <button onClick={() => setShowModal(null)} aria-label="Close" className="flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-neutral-100 rounded-sm transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-label-sm text-neutral-500 mb-1">Drug name</label>
                  <input name="drug_name" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Category</label>
                  <select name="category" className={inputClass}>
                    <option value="">Select</option>
                    <option value="analgesic">Analgesic</option>
                    <option value="antibiotic">Antibiotic</option>
                    <option value="antimalaria">Antimalaria</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Unit</label>
                  <select name="unit" className={inputClass}>
                    <option value="tablets">Tablets</option>
                    <option value="vials">Vials</option>
                    <option value="sachets">Sachets</option>
                    <option value="capsules">Capsules</option>
                    <option value="ml">ml</option>
                    <option value="mg">mg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Initial stock</label>
                  <input name="quantity_in_stock" type="number" min="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Low stock threshold</label>
                  <input name="low_stock_threshold" type="number" min="1" defaultValue={10} className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Cost per unit (NGN)</label>
                  <input name="cost_per_unit" type="number" min="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Expiry date</label>
                  <input name="expiry_date" type="date" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-label-sm text-neutral-500 mb-1">Supplier</label>
                  <input name="supplier_name" className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button label="Cancel" variant="secondary" onClick={() => setShowModal(null)} type="button">Cancel</Button>
                <Button label="Add drug" loading={modalLoading} type="submit">Add drug</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal === 'edit' && selectedDrug && (
        <div className="fixed inset-0 z-[999] bg-black/30 flex items-end sm:items-center justify-center overscroll-contain" onClick={() => { setShowModal(null); setSelectedDrug(null) }}>
          <div className="bg-sand-50 rounded-t-lg sm:rounded-lg p-6 shadow-xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain safe-area-bottom animate-[slideUp_200ms_ease-out] sm:animate-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md font-semibold text-neutral-900">Edit Drug</h3>
              <button onClick={() => { setShowModal(null); setSelectedDrug(null) }} aria-label="Close" className="flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-neutral-100 rounded-sm transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-label-sm text-neutral-500 mb-1">Drug name</label>
                  <input name="drug_name" defaultValue={selectedDrug.drug_name} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Category</label>
                  <select name="category" defaultValue={selectedDrug.category} className={inputClass}>
                    <option value="">Select</option>
                    <option value="analgesic">Analgesic</option>
                    <option value="antibiotic">Antibiotic</option>
                    <option value="antimalaria">Antimalaria</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Unit</label>
                  <select name="unit" defaultValue={selectedDrug.unit} className={inputClass}>
                    <option value="tablets">Tablets</option>
                    <option value="vials">Vials</option>
                    <option value="sachets">Sachets</option>
                    <option value="capsules">Capsules</option>
                    <option value="ml">ml</option>
                    <option value="mg">mg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Low stock threshold</label>
                  <input name="low_stock_threshold" type="number" min="1" defaultValue={selectedDrug.low_stock_threshold} className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Cost per unit (NGN)</label>
                  <input name="cost_per_unit" type="number" min="0" defaultValue={selectedDrug.cost_per_unit || ''} className={inputClass} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Expiry date</label>
                  <input name="expiry_date" type="date" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-label-sm text-neutral-500 mb-1">Supplier</label>
                  <input name="supplier_name" defaultValue={selectedDrug.supplier_name || ''} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button label="Cancel" variant="secondary" onClick={() => { setShowModal(null); setSelectedDrug(null) }} type="button">Cancel</Button>
                <Button label="Save" loading={modalLoading} type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showModal === 'restock' && selectedDrug && (
        <div className="fixed inset-0 z-[999] bg-black/30 flex items-end sm:items-center justify-center overscroll-contain" onClick={() => { setShowModal(null); setSelectedDrug(null) }}>
          <div className="bg-sand-50 rounded-t-lg sm:rounded-lg p-6 shadow-xl max-w-sm w-full safe-area-bottom animate-[slideUp_200ms_ease-out] sm:animate-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md font-semibold text-neutral-900">Restock {selectedDrug.drug_name}</h3>
              <button onClick={() => { setShowModal(null); setSelectedDrug(null) }} aria-label="Close" className="flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-neutral-100 rounded-sm transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-body-sm text-neutral-500 mb-4">Current stock: <strong>{selectedDrug.quantity_in_stock}</strong> {selectedDrug.unit}</p>
            <form onSubmit={handleRestock} className="flex flex-col gap-4">
              <div>
                <label className="block text-label-sm text-neutral-500 mb-1">Quantity to add</label>
                <input name="quantity" type="number" min="1" required className={inputClass} placeholder="e.g. 50" />
              </div>
              <div className="flex justify-end gap-3">
                <Button label="Cancel" variant="secondary" onClick={() => { setShowModal(null); setSelectedDrug(null) }} type="button">Cancel</Button>
                <Button label="Restock" loading={modalLoading} type="submit">Restock</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
