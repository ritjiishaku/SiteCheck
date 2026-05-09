'use client'

import { useState, use, startTransition, useMemo, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, Check } from 'lucide-react'

const inputClass = 'w-full px-4 py-3 sm:py-2.5 text-body-md sm:text-body-sm bg-white/70 border border-neutral-200 rounded-lg placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm'

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

export default function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const router = useRouter()
  const searchParams = use(props.searchParams)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  if (!mounted) startTransition(() => setMounted(true))

  const token = searchParams.token

  const deferredPassword = useDeferredValue(password)
  const passwordStrength = useMemo(() => getPasswordStrength(deferredPassword), [deferredPassword])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-dvh font-sans bg-sand-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg p-8 max-w-sm">
          <h1 className="text-headline-md font-bold text-neutral-900">Invalid reset link</h1>
          <p className="text-body-sm text-neutral-500 mt-2 mb-4">This link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-primary-600 font-semibold hover:text-primary-700">Request a new one</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh font-sans bg-sand-50 text-neutral-700 flex flex-col relative overflow-hidden selection:bg-primary-500/20">
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

      <div className="relative flex-1 flex items-center justify-center z-10 px-4 py-6">
        <div className={`w-full max-w-sm transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {!done ? (
            <>
              <div className="text-center mb-8">
                <Link href="/" className="inline-block text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-4">
                  SiteCheck
                </Link>
                <h1 className="text-headline-md sm:text-display-md font-bold text-neutral-900">Reset password</h1>
                <p className="text-body-sm text-neutral-500 mt-1">Enter your new password below.</p>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-5 sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="password" className="block text-label-sm font-medium text-neutral-700 mb-1">New password</label>
                    <div className="relative">
                      <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                        onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus className={inputClass + ' pr-12'} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-neutral-600 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                        </div>
                        <p className="text-micro text-neutral-400 mt-0.5">{passwordStrength.label}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirm" className="block text-label-sm font-medium text-neutral-700 mb-1">Confirm password</label>
                    <div className="relative">
                      <input id="confirm" type={showConfirm ? 'text' : 'password'} value={confirm}
                        onChange={(e) => setConfirm(e.target.value)} required minLength={8} className={inputClass + ' pr-12'} />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-neutral-600 transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-body-sm text-error bg-error-bg px-3 py-1.5 rounded-lg">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="inline-flex items-center justify-center min-h-[48px] w-full px-6 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
                    {loading ? 'Resetting...' : 'Reset password'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Link href="/" className="inline-block text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-6">
                SiteCheck
              </Link>
              <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-5">
                <Check className="h-7 w-7 text-secondary-500" />
              </div>
              <h1 className="text-headline-md sm:text-display-md font-bold text-neutral-900 mb-2">Password reset</h1>
              <p className="text-body-sm text-neutral-500">Your password has been updated. Redirecting to sign in...</p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
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
