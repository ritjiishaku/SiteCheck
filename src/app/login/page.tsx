'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Shield } from 'lucide-react'

const roleRedirects: Record<string, string> = {
  SuperAdmin: '/dashboard/super-admin',
  Admin: '/dashboard/admin',
  Manager: '/dashboard/manager',
  Medic: '/dashboard/medic',
}

const inputClass = 'w-full px-4 py-3 sm:py-2.5 text-body-md sm:text-body-sm bg-white/70 border border-neutral-200 rounded-lg placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  if (!mounted) startTransition(() => setMounted(true))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      localStorage.setItem('token', data.data.token)

      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${data.data.token}` },
      })
      const meData = await meRes.json()
      const role = meData.success ? meData.data.role : 'Medic'
      router.push(roleRedirects[role] || '/dashboard/medic')
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
          {/* ─── Logo + Header ─── */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-4">
              SiteCheck
            </Link>
            <h1 className="text-headline-md sm:text-display-md font-bold text-neutral-900 mt-1">Welcome back</h1>
            <p className="text-body-sm text-neutral-500 mt-1">Sign in to your account to continue.</p>
          </div>

          {/* ─── Card ─── */}
          <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-label-sm font-medium text-neutral-700 mb-1">Email</label>
                <input id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus
                  className={inputClass} placeholder="you@company.ng" />
              </div>
              <div>
                <label htmlFor="password" className="block text-label-sm font-medium text-neutral-700 mb-1">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    className={inputClass + ' pr-12'} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-neutral-600 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between min-h-[44px]">
                <label className="flex items-center gap-2 text-body-sm text-neutral-500 cursor-pointer py-2">
                  <input type="checkbox" defaultChecked className="rounded-sm border-neutral-300 text-primary-500 focus:ring-primary-500" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-body-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors py-2">
                  Forgot password?
                </Link>
              </div>

              {error && <p className="text-body-sm text-error bg-error-bg px-3 py-1.5 rounded-lg">{error}</p>}

              <button type="submit" disabled={loading}
                className="relative inline-flex items-center justify-center min-h-[48px] w-full px-6 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* ─── Footer ─── */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-body-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors min-h-[44px] inline-flex items-center">
                Create one
              </Link>
            </p>
            <div className="flex items-center gap-2 text-micro text-neutral-400">
              <Shield className="h-3 w-3" />
              NDPA compliant
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
