'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Mail, FileText, Download, CheckCircle, AlertCircle, Clock, FileSpreadsheet } from 'lucide-react'
import { useAuthGuard } from '@/hooks/useAuthGuard'

interface ReportHistory {
  report_id: string
  report_type: string
  export_format: string
  total_patients_seen: number
  sent_via_email: boolean
  recipient_email: string | null
  status: string
  created_at: string
  generator: { full_name: string }
}

interface UserProfile {
  medic_id: string
  full_name: string
  role: string
  company_name: string
}

export default function ReportsPage() {
  useAuthGuard(['Manager', 'Admin', 'SuperAdmin'])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [reportType, setReportType] = useState('Daily')
  const [exportFormat, setExportFormat] = useState('PDF')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [history, setHistory] = useState<ReportHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const [meRes, histRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/reports', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const meData = await meRes.json()
        if (meData.success) setUser(meData.data)

        const histData = await histRes.json()
        if (histData.success) setHistory(histData.data || [])
      } catch {
        // silent
      } finally {
        setHistoryLoading(false)
      }
    }
    load()
  }, [])

  async function handleGenerate() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          report_type: reportType,
          date_from: dateFrom || new Date().toISOString(),
          date_to: dateTo || new Date().toISOString(),
          export_format: exportFormat,
          recipient_email: sendEmail ? recipientEmail : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessage(err.error || 'Something went wrong.')
        setMessageType('error')
        return
      }

      const emailed = res.headers.get('X-Report-Emailed') === 'true'
      const filename = (res.headers.get('Content-Disposition') || '').match(/filename="(.+)"/)?.[1] || `report.${exportFormat.toLowerCase()}`

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const parts = [`${exportFormat} report downloaded.`]
      if (emailed) parts.push(`Sent to ${recipientEmail}.`)
      setMessage(parts.join(' '))
      setMessageType('success')

      const histRes = await fetch('/api/v1/reports', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const histData = await histRes.json()
      if (histData.success) setHistory(histData.data || [])
    } catch {
      setMessage('Something went wrong. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25'

  const userName = user?.full_name || 'Dr. Example'
  const userRole = user?.role || 'Manager'

  return (
    <DashboardLayout title="Reports" medicName={userName} role={userRole}>
      <Card className="mb-8">
        <h3 className="text-headline-md font-semibold text-neutral-900 mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="report-type" className="block text-body-md font-medium text-neutral-700 mb-1">Report type</label>
            <select id="report-type" value={reportType} onChange={(e) => setReportType(e.target.value)} className={inputClass}>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div>
            <label htmlFor="export-format" className="block text-body-md font-medium text-neutral-700 mb-1">Export format</label>
            <select id="export-format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className={inputClass}>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
            </select>
          </div>
          <div>
            <label htmlFor="date-from" className="block text-body-md font-medium text-neutral-700 mb-1">Date from</label>
            <input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="date-to" className="block text-body-md font-medium text-neutral-700 mb-1">Date to</label>
            <input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-3 text-body-md text-neutral-700">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded-sm border-neutral-300 text-primary-500 focus:ring-primary-500" />
            <Mail className="h-4 w-4 text-neutral-400" />
            Email the report
          </label>
          {sendEmail && (
            <div className="mt-3">
              <label htmlFor="recipient-email" className="block text-body-md font-medium text-neutral-700 mb-1">Recipient email</label>
              <input id="recipient-email" type="email" value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className={inputClass + ' max-w-sm'} placeholder="manager@company.ng" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button label="Generate" loading={loading} onClick={handleGenerate}>
            {loading ? <FileText className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
            {loading ? 'Generating...' : 'Generate & Download'}
          </Button>
          {message && (
            <p className={`flex items-center gap-2 text-body-sm px-4 py-2 rounded-sm ${
              messageType === 'success' ? 'text-secondary-700 bg-secondary-50' : 'text-error bg-error-bg'
            }`}>
              {messageType === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {message}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline-md font-semibold text-neutral-900">Report History</h3>
        </div>
        {historyLoading ? (
          <SkeletonTable rows={4} cols={7} />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Clock className="h-8 w-8 text-neutral-200 mb-3" />
            <p className="text-body-md text-neutral-400">No reports generated yet.</p>
            <p className="text-body-sm text-neutral-300 mt-1">Your generated reports will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-label-sm text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Format</th>
                  <th className="text-left px-4 py-3 font-medium">Patients</th>
                  <th className="text-left px-4 py-3 font-medium">Generated By</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r.report_id} className={`border-b border-neutral-100 text-body-md hover:bg-primary-50 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-sand-50'}`}>
                    <td className="px-4 py-3 text-neutral-900 font-medium">{r.report_type}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        {r.export_format === 'PDF' ? <FileText className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                        {r.export_format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{r.total_patients_seen}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.generator?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {r.sent_via_email ? (
                        <span className="inline-flex items-center gap-1 text-secondary-700">
                          <Mail className="h-3.5 w-3.5" /> Sent
                        </span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-[10px] py-[3px] rounded-full border text-label-sm font-medium ${
                        r.status === 'Sent' ? 'bg-secondary-50 text-secondary-900 border-secondary-300' :
                        r.status === 'Failed' ? 'bg-error-bg text-error border-error' :
                        'bg-neutral-100 text-neutral-500 border-neutral-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}
