'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useRouter } from 'next/navigation'

interface UserProfile {
  medic_id: string
  full_name: string
  email: string
  role: string
  company_name: string
}

interface SubStatus {
  status: string
  plan: string
  period_end?: string
}

const PLANS = [
  {
    id: 'Monthly',
    price: 15000,
    label: 'Monthly',
    description: 'Billed every month',
    features: ['Full platform access', 'Unlimited patient records', 'Drug inventory management', 'Reports & exports', 'Email support'],
  },
  {
    id: 'Quarterly',
    price: 40000,
    label: 'Quarterly',
    description: 'Save 11%',
    features: ['Everything in Monthly', 'Priority email support', 'Bulk report exports', '2 months free per year'],
    popular: true,
  },
  {
    id: 'Annual',
    price: 150000,
    label: 'Annual',
    description: 'Save 17%',
    features: ['Everything in Quarterly', 'Dedicated support', 'Early access to new features', '2 months free'],
  },
]

const inputClass = 'w-full px-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25'

export default function SubscriptionPage() {
  useAuthGuard(['Admin', 'SuperAdmin'])
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('Monthly')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token) { router.push('/login'); return }

        const [meRes, subRes] = await Promise.all([
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/payments/status', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const meData = await meRes.json()
        if (meData.success) {
          setUser(meData.data)
          setEmail(meData.data.email)
        }

        const subData = await subRes.json()
        if (subData.success) setSubStatus(subData.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handleSubscribe() {
    if (!selectedPlan || !email) return
    setSubmitting(true)
    setMessage('')

    const plan = PLANS.find((p) => p.id === selectedPlan)
    if (!plan) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan: plan.id,
          amount_ngn: plan.price,
          email,
        }),
      })

      const data = await res.json()
      if (data.success && data.data?.payment_link) {
        window.location.href = data.data.payment_link
      } else {
        setMessage(data.error || 'Could not initiate payment.')
        setMessageType('error')
      }
    } catch {
      setMessage('Something went wrong. Please try again.')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const userName = user?.full_name || 'Loading...'
  const userRole = user?.role || 'Admin'

  if (loading) {
    return (
      <DashboardLayout title="Subscription" medicName={userName} role={userRole}>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-sand-50 rounded-lg p-6 shadow-sm">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-10 w-32 mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Subscription" medicName={userName} role={userRole}>
      {subStatus && subStatus.status === 'Active' && (
        <div className="mb-8 p-4 bg-secondary-50 border border-secondary-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-secondary-600 shrink-0" />
          <div>
            <p className="text-body-md font-semibold text-secondary-900">
              {subStatus.plan} plan is active
            </p>
            {subStatus.period_end && (
              <p className="text-body-sm text-secondary-700">
                Renews on {new Date(subStatus.period_end).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        </div>
      )}

      {subStatus && subStatus.status === 'PastDue' && (
        <div className="mb-8 p-4 bg-tertiary-50 border border-tertiary-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-tertiary-600 shrink-0" />
          <p className="text-body-md font-semibold text-tertiary-800">
            Your subscription has expired. Please renew to continue using SiteCheck.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => {
          const selected = selectedPlan === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative text-left bg-sand-50 rounded-lg p-6 shadow-sm border-2 transition-all hover:shadow-md ${
                selected ? 'border-primary-500 ring-2 ring-primary-500/25' : 'border-transparent'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-label-sm font-semibold rounded-full">
                  Popular
                </span>
              )}
              <p className="text-body-sm text-neutral-500 uppercase tracking-wide font-medium mb-1">{plan.label}</p>
              <p className="text-display-lg font-bold text-neutral-900 mb-1">
                ₦{plan.price.toLocaleString()}
              </p>
              <p className="text-body-sm text-neutral-400 mb-4">{plan.description}</p>
              <ul className="flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-neutral-600">
                    <CheckCircle className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <Card>
        <h3 className="text-headline-md font-semibold text-neutral-900 mb-4">Payment Details</h3>
        <div className="max-w-md flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-body-md font-medium text-neutral-700 mb-1">
              Email for payment receipt
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="admin@company.ng"
            />
          </div>

          {message && (
            <p className={`flex items-center gap-2 text-body-sm px-4 py-2 rounded-sm ${
              messageType === 'success' ? 'text-secondary-700 bg-secondary-50' : 'text-error bg-error-bg'
            }`}>
              {messageType === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {message}
            </p>
          )}

          <Button
            label="Subscribe"
            loading={submitting}
            onClick={handleSubscribe}
            disabled={!selectedPlan || !email}
          >
            <CreditCard className="h-4 w-4" />
            {submitting ? 'Processing...' : `Pay ₦${(PLANS.find((p) => p.id === selectedPlan)?.price || 0).toLocaleString()}`}
          </Button>

          <p className="text-body-sm text-neutral-400 flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" />
            You will be redirected to Flutterwave to complete payment.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  )
}
