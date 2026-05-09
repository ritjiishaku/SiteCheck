'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { SkeletonStatGrid, SkeletonTable } from '@/components/ui/Skeleton'
import { Search, Building2, ShieldAlert, Activity, CreditCard } from 'lucide-react'
import { useAuthGuard } from '@/hooks/useAuthGuard'

interface AuditEntry {
  audit_id: string
  action: string
  target_record_id: string | null
  target_record_type: string | null
  timestamp: string
  performer: { full_name: string; email: string; company_name: string }
}

interface UserProfile {
  medic_id: string
  full_name: string
  role: string
  company_name: string
}

export default function SuperAdminPage() {
  useAuthGuard(['SuperAdmin'])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [totalAudit, setTotalAudit] = useState(0)
  const [auditSearch, setAuditSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSubscriptions, setActiveSubscriptions] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const [meRes, auditRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/audit-logs?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const meData = await meRes.json()
        if (meData.success) setUser(meData.data)

        const auditData = await auditRes.json()
        if (auditData.success) {
          setAuditEntries(auditData.entries || [])
          setTotalAudit(auditData.total || 0)
        }

        const paymentEvents = auditData.entries?.filter(
          (e: { action: string }) => e.action.toLowerCase().includes('payment') || e.action.toLowerCase().includes('subscription')
        ) || []
        setActiveSubscriptions(paymentEvents.length)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredAudit = auditEntries.filter((e) =>
    e.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    e.performer?.email?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    e.performer?.company_name?.toLowerCase().includes(auditSearch.toLowerCase())
  )

  const uniqueCompanies = new Set(auditEntries.map((e) => e.performer?.company_name).filter(Boolean))
  const uniqueMedics = new Set(auditEntries.map((e) => e.performer?.email).filter(Boolean))

  const userName = user?.full_name || 'System Admin'
  const userRole = user?.role || 'SuperAdmin'

  return (
    <DashboardLayout title="Admin Panel" medicName={userName} role={userRole}>
      {loading ? (
        <div className="flex flex-col gap-8">
          <SkeletonStatGrid count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonTable rows={4} cols={2} />
            <SkeletonTable rows={4} cols={2} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Companies</p>
                  <p className="text-display-md font-bold text-neutral-900">{uniqueCompanies.size}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Total Medics</p>
                  <p className="text-display-md font-bold text-neutral-900">{uniqueMedics.size}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Audit Entries</p>
                  <p className="text-display-md font-bold text-neutral-900">{totalAudit}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-label-sm text-neutral-500 uppercase tracking-wide">Payment Events</p>
                  <p className="text-display-md font-bold text-neutral-900">{activeSubscriptions}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-headline-md font-semibold text-neutral-900 mb-4">Companies Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-label-sm text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                      <th className="text-left px-4 py-3 font-medium">Company</th>
                      <th className="text-left px-4 py-3 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(uniqueCompanies).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-12 text-center text-body-md text-neutral-400">No companies found.</td>
                      </tr>
                    ) : (
                      Array.from(uniqueCompanies).map((c) => (
                        <tr key={c} className="border-b border-neutral-100 text-body-md hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3 text-neutral-900 font-medium">{c}</td>
                          <td className="px-4 py-3 text-neutral-500">{auditEntries.filter((e) => e.performer?.company_name === c).length} audit entries</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h3 className="text-headline-md font-semibold text-neutral-900 mb-4">Audit Log</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input type="text" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit log..." className="w-full pl-10 pr-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25" />
              </div>
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {filteredAudit.length === 0 ? (
                  <p className="text-body-md text-neutral-400 text-center py-6">No audit entries match your search.</p>
                ) : (
                  filteredAudit.map((entry) => (
                    <div key={entry.audit_id} className="px-4 py-3 rounded-sm bg-neutral-50 border border-neutral-100 text-body-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-neutral-900">{entry.action}</span>
                        <span className="text-neutral-400">{new Date(entry.timestamp).toLocaleString('en-GB')}</span>
                      </div>
                      <p className="text-neutral-500">
                        {entry.performer?.email || 'Unknown'} &mdash; {entry.target_record_type || 'N/A'}
                        <span className="text-neutral-300 mx-1">&middot;</span>
                        {entry.performer?.company_name || 'N/A'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
