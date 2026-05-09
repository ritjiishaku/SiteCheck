'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { SkeletonStatGrid, SkeletonTable } from '@/components/ui/Skeleton'
import { Plus, FileText, Clock, Users, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAuthGuard'

interface UserProfile {
  medic_id: string
  full_name: string
  email: string
  role: string
  company_name: string
}

interface PatientSummary {
  patient_id: string
  full_name: string
  staff_code: string
  department: string
  date_of_visit: string
  created_at: string
  status: string
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), diff))
}

export default function MedicDashboard() {
  const router = useRouter()
  useAuthGuard(['Medic'])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) { router.push('/login'); return }

        const [meRes, patRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/patients', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const meData = await meRes.json()
        if (meData.success) setUser(meData.data)

        const patData = await patRes.json()
        if (patData.success) setPatients(patData.data || [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)

  const patientsToday = patients.filter((p) => new Date(p.created_at) >= todayStart).length
  const patientsThisWeek = patients.filter((p) => new Date(p.created_at) >= weekStart).length
  const patients30Days = patients.filter((p) => new Date(p.created_at) >= new Date(now.getTime() - 30 * 86400000)).length

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.staff_code.toLowerCase().includes(search.toLowerCase())
  )

  const userName = user?.full_name || 'Loading...'
  const userRole = user?.role || 'Medic'

  return (
    <DashboardLayout title="My Records" medicName={userName} role={userRole}>
      {loading ? (
        <div className="flex flex-col gap-8">
          <SkeletonStatGrid count={3} />
          <SkeletonTable rows={5} cols={5} />
        </div>
      ) : (
        <>
          <button
            onClick={() => router.push('/dashboard/patient-intake')}
            className="w-full sm:w-auto mb-8 flex items-center justify-center gap-3 px-6 py-4 sm:py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-700 transition-colors shadow-sm min-h-[56px] sm:min-h-[48px] text-body-md font-semibold"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
            <span>New Patient Intake</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Patients Today</p>
                  <p className="text-display-md font-bold text-neutral-900">{patientsToday}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">This Week</p>
                  <p className="text-display-md font-bold text-neutral-900">{patientsThisWeek}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Last 30 Days</p>
                  <p className="text-display-md font-bold text-neutral-900">{patients30Days}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-headline-md font-semibold text-neutral-900">Recent Patients</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-10 pr-4 py-3 sm:py-2 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25" />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-8 w-8 text-neutral-200 mb-3" />
                <p className="text-body-md text-neutral-400">
                  {search ? 'No patients match your search.' : 'No patients recorded yet.'}
                </p>
                <p className="text-body-sm text-neutral-300 mt-1">
                  {search ? '' : 'Your patient records will appear here after your first intake.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {filtered.map((p) => (
                    <div key={p.patient_id} className="bg-sand-50 border border-neutral-100 rounded-lg p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-label-xs text-neutral-400 uppercase tracking-wide">Name: </span>
                          <span className="text-body-md font-semibold text-neutral-900">{p.full_name}</span>
                        </div>
                        <span className={`inline-flex items-center shrink-0 px-[10px] py-[3px] rounded-full border text-label-sm font-medium ${
                          p.status === 'Active'
                            ? 'bg-secondary-50 text-secondary-900 border-secondary-300'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-label-xs text-neutral-400 uppercase tracking-wide">Staff Code: </span>
                        <span className="text-body-sm text-neutral-700">{p.staff_code}</span>
                      </div>
                      <div>
                        <span className="text-label-xs text-neutral-400 uppercase tracking-wide">Department: </span>
                        <span className="text-body-sm text-neutral-700">{p.department}</span>
                      </div>
                      <div>
                        <span className="text-label-xs text-neutral-400 uppercase tracking-wide">Date: </span>
                        <span className="text-body-sm text-neutral-700">{new Date(p.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-label-sm text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">Staff Code</th>
                        <th className="text-left px-4 py-3 font-medium">Department</th>
                        <th className="text-left px-4 py-3 font-medium">Date</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p, i) => (
                        <tr key={p.patient_id} className={`border-b border-neutral-100 text-body-md hover:bg-primary-50 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-sand-50'}`}>
                          <td className="px-4 py-3 text-neutral-900 font-medium">{p.full_name}</td>
                          <td className="px-4 py-3 text-neutral-500">{p.staff_code}</td>
                          <td className="px-4 py-3 text-neutral-500">{p.department}</td>
                          <td className="px-4 py-3 text-neutral-500">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-[10px] py-[3px] rounded-full border text-label-sm font-medium ${
                              p.status === 'Active'
                                ? 'bg-secondary-50 text-secondary-900 border-secondary-300'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}
