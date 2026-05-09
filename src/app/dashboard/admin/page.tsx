'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Skeleton, SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton'
import { Search, Shield, Settings as SettingsIcon, CreditCard, Package } from 'lucide-react'
import { useAuthGuard } from '@/hooks/useAuthGuard'

interface MedicRow {
  medic_id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
}

interface UserProfile {
  medic_id: string
  full_name: string
  role: string
  company_name: string
  site_location: string | null
}

export default function AdminPage() {
  useAuthGuard(['Admin', 'SuperAdmin'])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [medics, setMedics] = useState<MedicRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [siteLocation, setSiteLocation] = useState('')
  const [subStatus, setSubStatus] = useState<{ status: string; plan: string; period_end?: string } | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const [meRes, medicsRes, subRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/medics', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/payments/status', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const meData = await meRes.json()
        if (meData.success) {
          setUser(meData.data)
          setCompanyName(meData.data.company_name)
          setSiteLocation(meData.data.site_location || '')
        }

        const medicsData = await medicsRes.json()
        if (medicsData.success) setMedics(medicsData.data || [])

        const subData = await subRes.json()
        if (subData.success) setSubStatus(subData.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSaveSettings() {
    setSaving(true)
    setSaveMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/medics/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site_location: siteLocation }),
      })
      const data = await res.json()
      setSaveMsg(data.success ? 'Settings saved.' : 'Could not save.')
    } catch {
      setSaveMsg('Could not save.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  const filtered = medics.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const inputClass = 'w-full px-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25'

  const userName = user?.full_name || 'Loading...'
  const userRole = user?.role || 'Admin'

  return (
    <DashboardLayout title="Settings" medicName={userName} role={userRole}>
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonTable rows={5} cols={4} />
          </div>
          <div className="flex flex-col gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-headline-md font-semibold text-neutral-900">Medic Profiles</h3>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medics..." className={inputClass + ' pl-10'} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="text-label-sm text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Role</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-body-md text-neutral-400">
                          {search ? 'No medics match your search.' : 'No medics found.'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((m) => (
                        <tr key={m.medic_id} className="border-b border-neutral-100 text-body-md hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3 text-neutral-900 font-medium">{m.full_name}</td>
                          <td className="px-4 py-3 text-neutral-500">{m.email}</td>
                          <td className="px-4 py-3 text-neutral-700 capitalize">{m.role}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-[10px] py-[3px] rounded-full border text-label-sm font-medium ${
                              m.is_active
                                ? 'bg-secondary-50 text-secondary-900 border-secondary-300'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                            }`}>
                              {m.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <SettingsIcon className="h-5 w-5 text-primary-600" />
                <h3 className="text-headline-md font-semibold text-neutral-900">Company Settings</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Company name</label>
                  <input type="text" value={companyName} disabled className={inputClass + ' bg-neutral-50 text-neutral-500 cursor-default'} />
                </div>
                <div>
                  <label className="block text-label-sm text-neutral-500 mb-1">Site location</label>
                  <input type="text" value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} className={inputClass} placeholder="e.g. Site 3, Port Harcourt" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveSettings} disabled={saving}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-md bg-primary-500 text-white text-body-md font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {saveMsg && <span className="text-body-sm text-secondary-700">{saveMsg}</span>}
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-primary-600" />
                <h3 className="text-headline-md font-semibold text-neutral-900">Subscription</h3>
              </div>
              {subStatus ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-body-sm text-neutral-500">Status</span>
                    <span className={`inline-flex items-center px-[10px] py-[3px] rounded-full border text-label-sm font-medium ${
                      subStatus.status === 'Active' ? 'bg-secondary-50 text-secondary-900 border-secondary-300' :
                      subStatus.status === 'none' ? 'bg-tertiary-50 text-tertiary-700 border-tertiary-300' :
                      'bg-error-bg text-error border-error'
                    }`}>
                      {subStatus.status}
                    </span>
                  </div>
                  {subStatus.plan && (
                    <div className="flex justify-between items-center">
                      <span className="text-body-sm text-neutral-500">Plan</span>
                      <span className="text-body-sm text-neutral-700 font-medium">{subStatus.plan}</span>
                    </div>
                  )}
                  {subStatus.period_end && (
                    <div className="flex justify-between items-center">
                      <span className="text-body-sm text-neutral-500">Renewal</span>
                      <span className="text-body-sm text-neutral-700">{new Date(subStatus.period_end).toLocaleDateString('en-GB')}</span>
                    </div>
                  )}
                  <a href="/dashboard/subscription"
                    className="mt-3 inline-flex items-center gap-1 text-body-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">
                    Manage subscription &rarr;
                  </a>
                  {subStatus.status === 'none' && (
                    <p className="text-body-sm text-neutral-400 mt-2">No active subscription. Set up payment to activate your plan.</p>
                  )}
                </div>
              ) : (
                <div className="h-8 bg-neutral-50 rounded-sm animate-pulse" />
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-primary-600" />
                <h3 className="text-headline-md font-semibold text-neutral-900">Security</h3>
              </div>
              <p className="text-body-sm text-neutral-500 mb-3">Session auto-lock is enabled. Inactive sessions are locked after 10 minutes.</p>
              <p className="text-body-sm text-neutral-500">All access is logged in the audit trail.</p>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-primary-600" />
                <h3 className="text-headline-md font-semibold text-neutral-900">Quick Links</h3>
              </div>
              <div className="flex flex-col gap-2">
                <a href="/dashboard/drugs" className="flex items-center gap-2 px-3 py-2 rounded-sm text-body-sm text-primary-600 font-medium hover:bg-primary-50 transition-colors">
                  <Package className="h-4 w-4" /> Drug Inventory
                </a>
                <a href="/dashboard/reports" className="flex items-center gap-2 px-3 py-2 rounded-sm text-body-sm text-primary-600 font-medium hover:bg-primary-50 transition-colors">
                  <SettingsIcon className="h-4 w-4" /> Reports
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
