'use client'

import { useState, startTransition } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Mail } from 'lucide-react'

const inputClass = 'w-full px-4 py-3 sm:py-2.5 text-body-md sm:text-body-sm bg-white/70 border border-neutral-200 rounded-lg placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  if (!mounted) startTransition(() => setMounted(true))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <Link href="/" className="inline-block text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-4">
                  SiteCheck
                </Link>
                <h1 className="text-headline-md sm:text-display-md font-bold text-neutral-900">Reset password</h1>
                <p className="text-body-sm text-neutral-500 mt-1">Enter your email to receive a reset link.</p>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-5 sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="email" className="block text-label-sm font-medium text-neutral-700 mb-1">Email</label>
                    <input id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required autoFocus
                      className={inputClass} placeholder="you@company.ng" />
                  </div>
                  {error && <p className="text-body-sm text-error bg-error-bg px-3 py-1.5 rounded-lg">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="inline-flex items-center justify-center min-h-[48px] w-full px-6 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Link href="/" className="inline-block text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent mb-6">
                SiteCheck
              </Link>
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
                <Mail className="h-7 w-7 text-primary-500" />
              </div>
              <h1 className="text-headline-md sm:text-display-md font-bold text-neutral-900 mb-2">Check your email</h1>
              <p className="text-body-sm text-neutral-500">
                If an account exists for <span className="font-medium text-neutral-700">{email}</span>, we&apos;ve sent a reset link.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-body-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>

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
