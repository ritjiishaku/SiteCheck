'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton'
import { Users, Pill, AlertTriangle, ArrowRight, Activity } from 'lucide-react'
import { useAuthGuard } from '@/hooks/useAuthGuard'

interface UserProfile {
  medic_id: string
  full_name: string
  role: string
  company_name: string
}

interface PatientRecord {
  created_at: string
  drugs_dispensed?: { drug_name: string; quantity_dispensed: number; unit: string }[]
}

interface DrugItem {
  quantity_in_stock: number
  low_stock_threshold: number
}

export default function ManagerDashboard() {
  useAuthGuard(['Manager', 'Admin', 'SuperAdmin'])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [patientsToday, setPatientsToday] = useState(0)
  const [drugsDispensed, setDrugsDispensed] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const [meRes, patRes, drugRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/patients', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/drugs', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const meData = await meRes.json()
        if (meData.success) setUser(meData.data)

        const patData = await patRes.json()
        if (patData.success) {
          const now = new Date()
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayPatients: PatientRecord[] = patData.data.filter((p: PatientRecord) => new Date(p.created_at) >= todayStart)
          setPatientsToday(todayPatients.length)

          const dispensed = todayPatients.reduce((sum: number, p: PatientRecord) => {
            const drugs = p.drugs_dispensed || []
            return sum + drugs.reduce((s: number, d) => s + (d.quantity_dispensed || 0), 0)
          }, 0)
          setDrugsDispensed(dispensed)
        }

        const drugData = await drugRes.json()
        if (drugData.success) {
          const low = drugData.data.filter((d: DrugItem) => d.quantity_in_stock > 0 && d.quantity_in_stock <= d.low_stock_threshold).length
          setLowStockCount(low)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const userName = user?.full_name || 'Loading...'
  const userRole = user?.role || 'Manager'

  return (
    <DashboardLayout title="Dashboard" medicName={userName} role={userRole}>
      {loading ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <div className="bg-sand-50 rounded-lg p-5 shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-20 rounded-sm" />
              <Skeleton className="h-20 rounded-sm" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="!p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Patients Today</p>
                  <p className="text-display-md font-bold text-neutral-900">{patientsToday}</p>
                </div>
              </div>
              <p className="text-body-sm text-neutral-400">{patientsToday === 0 ? 'No patients recorded yet today.' : `${patientsToday} patient(s) seen today.`}</p>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Drugs Dispensed</p>
                  <p className="text-display-md font-bold text-neutral-900">{drugsDispensed}</p>
                </div>
              </div>
              <p className="text-body-sm text-neutral-400">Units dispensed today.</p>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-tertiary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Low Stock Items</p>
                  <p className="text-display-md font-bold text-tertiary-500">{lowStockCount}</p>
                </div>
              </div>
              <p className="text-body-sm text-neutral-400">Items below threshold.</p>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md font-semibold text-neutral-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="/dashboard/drugs" className="flex items-center gap-3 p-4 rounded-sm bg-white border border-neutral-100 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Pill className="h-5 w-5 text-primary-500" />
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-neutral-900">Drug Inventory</p>
                  <p className="text-body-sm text-neutral-500">View and manage stock levels</p>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </a>
              <a href="/dashboard/reports" className="flex items-center gap-3 p-4 rounded-sm bg-white border border-neutral-100 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Activity className="h-5 w-5 text-primary-500" />
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-neutral-900">Reports</p>
                  <p className="text-body-sm text-neutral-500">Generate and export reports</p>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </a>
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}
