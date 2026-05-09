'use client'

import { useState, useMemo, useDeferredValue, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Shield } from 'lucide-react'

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: '', color: '', width: '0%' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return { label: 'Weak', color: 'bg-error', width: '25%' }
  if (score <= 4) return { label: 'Fair', color: 'bg-tertiary-500', width: '50%' }
  if (score <= 5) return { label: 'Good', color: 'bg-secondary-500', width: '75%' }
  return { label: 'Strong', color: 'bg-primary-500', width: '100%' }
}

function isValidNigerianPhone(phone: string): boolean {
  return /^(0[789]\d{9}|\+234[789]\d{9})$/.test(phone.replace(/[\s-]/g, ''))
}

const inputClass = 'w-full px-4 py-3 sm:py-2.5 text-body-md sm:text-body-sm bg-white/70 border border-neutral-200 rounded-lg placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    role: 'Medic',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  if (!mounted) startTransition(() => setMounted(true))

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const deferredPassword = useDeferredValue(form.password)
  const strength = useMemo(() => getPasswordStrength(deferredPassword), [deferredPassword])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!isValidNigerianPhone(form.phone)) { setError('Enter a valid Nigerian phone number (e.g. 08031234567).'); return }
    if (!acceptedTerms) { setError('You must accept the terms and privacy policy.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.fullName,
          email: form.email,
          phone_number: form.phone,
          company_name: form.companyName,
          role: form.role,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      localStorage.setItem('token', data.data.token)
      router.push('/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh font-sans bg-sand-50 text-neutral-700 flex flex-col relative overflow-hidden selection:bg-primary-500/20">
      {/* ─── Background ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sand-50 via-white to-primary-50/40" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-500/5 via-primary-300/3 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-tertiary-500/4 to-transparent rounded-full blur-[100px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1A9E78" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* ─── Content ─── */}
      <div className="relative flex-1 flex items-center justify-center z-10 px-4 py-6">
        <div className={`w-full max-w-sm transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-4">
              SiteCheck
            </Link>
            <h1 className="text-headline-md sm:text-display-md font-bold text-neutral-900">Create your account</h1>
            <p className="text-body-sm text-neutral-500 mt-1">Free to get started. No credit card required.</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-label-sm font-medium text-neutral-700 mb-1">Full name</label>
                  <input id="fullName" type="text" value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)} required autoFocus className={inputClass} placeholder="Dr. Amina Bello" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-label-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input id="email" type="email" value={form.email}
                    onChange={(e) => update('email', e.target.value)} required autoComplete="email" className={inputClass} placeholder="amina@company.ng" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-label-sm font-medium text-neutral-700 mb-1">Phone</label>
                  <input id="phone" type="tel" value={form.phone}
                    onChange={(e) => update('phone', e.target.value)} required autoComplete="tel" className={inputClass} placeholder="08031234567" />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-label-sm font-medium text-neutral-700 mb-1">Company</label>
                  <input id="companyName" type="text" value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)} required className={inputClass} placeholder="Eko Clinic Ltd" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="role" className="block text-label-sm font-medium text-neutral-700 mb-1">Role</label>
                  <select id="role" value={form.role} onChange={(e) => update('role', e.target.value)} required className={inputClass}>
                    <option value="Medic">Medic</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-label-sm font-medium text-neutral-700 mb-1">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={(e) => update('password', e.target.value)} required minLength={8} autoComplete="new-password"
                    className={inputClass + ' pr-12'} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-neutral-600 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5">
                    <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                    </div>
                    <p className="text-micro text-neutral-400 mt-0.5">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-label-sm font-medium text-neutral-700 mb-1">Confirm password</label>
                <div className="relative">
                  <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)} required minLength={8} autoComplete="new-password"
                    className={inputClass + ' pr-12'} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-neutral-600 transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2 text-body-sm text-neutral-500 cursor-pointer">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded-sm border-neutral-300 text-primary-500 focus:ring-primary-500 shrink-0" />
                <span className="text-body-sm">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 font-semibold hover:text-primary-700">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary-600 font-semibold hover:text-primary-700">Privacy Policy</a>.
                </span>
              </label>

              {error && <p className="text-body-sm text-error bg-error-bg px-3 py-1.5 rounded-lg">{error}</p>}

              <button type="submit" disabled={loading}
                className="relative inline-flex items-center justify-center min-h-[48px] w-full px-6 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-body-sm text-neutral-500">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">Sign in</Link>
            </p>
            <div className="flex items-center gap-2 text-micro text-neutral-400">
              <Shield className="h-3 w-3" />
              NDPA compliant &middot; Made for Nigeria
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
