'use client'

import { useState, startTransition } from 'react'
import { Shield, ArrowRight, ChevronRight, Menu, X } from 'lucide-react'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  if (!mounted) startTransition(() => setMounted(true))

  return (
    <div className="h-dvh font-sans text-neutral-700 flex flex-col relative overflow-hidden bg-sand-50 selection:bg-primary-500/20">
      {/* ─── Background ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sand-50 via-white to-primary-50/40" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-500/4 via-primary-300/3 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-tertiary-500/4 to-transparent rounded-full blur-[100px]" />
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1A9E78" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="relative shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-10 h-14 sm:h-16">
          <span className="text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            SiteCheck
          </span>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <a href="/login"
              className="text-body-md text-neutral-500 hover:text-neutral-900 transition-colors px-4 py-2">
              Sign in
            </a>
            <a href="/signup"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenu((v) => !v)}
            aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
            className="sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile backdrop */}
        {mobileMenu && (
          <div className="sm:hidden fixed inset-0 z-20" onClick={() => setMobileMenu(false)} aria-hidden="true" />
        )}

        {/* Mobile dropdown menu */}
        {mobileMenu && (
          <div className="sm:hidden fixed top-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-b border-neutral-100 shadow-lg animate-[fadeIn_150ms_ease-out]">
            <div className="px-4 py-6 flex flex-col gap-3">
              <a href="/login"
                onClick={() => setMobileMenu(false)}
                className="flex items-center justify-center min-h-[48px] px-6 rounded-full border border-neutral-200 text-neutral-700 text-body-md font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-colors w-full">
                Sign in
              </a>
              <a href="/signup"
                onClick={() => setMobileMenu(false)}
                className="flex items-center justify-center min-h-[48px] px-6 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-colors w-full">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative flex-1 flex items-center z-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* ─── Text ─── */}
            <div className={`max-w-xl transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/70 border border-primary-100/60 text-micro sm:text-body-sm font-medium text-primary-700 mb-6 sm:mb-8 backdrop-blur-md shadow-sm">
                <Shield className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                <span className="hidden sm:inline">NDPA compliant &middot; Made for Nigeria</span>
                <span className="sm:hidden">NDPA compliant</span>
              </div>

              <h1 className="text-[36px] sm:text-[52px] lg:text-[62px] font-bold leading-[1.04] tracking-tight text-neutral-900">
                Eliminate{' '}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                    double-entry
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-2 sm:h-3 bg-primary-500/10 -rotate-1 rounded-sm" />
                </span>
                <br />
                for site medics.
              </h1>

              <p className="mt-4 sm:mt-6 text-body-md sm:text-headline-sm text-neutral-500 leading-relaxed max-w-md">
                One digital workflow replaces paper records, Excel reports, and endless emails. Works with or without internet.
              </p>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4">
                <a href="/signup"
                  className="group inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto hover:-translate-y-0.5">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <a href="/login"
                  className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full border border-neutral-200 bg-white/60 backdrop-blur-sm text-neutral-700 text-body-md font-semibold hover:border-neutral-300 hover:bg-white hover:text-neutral-900 transition-all duration-300 w-full sm:w-auto">
                  Sign in
                </a>
              </div>

              <a href="/about"
                className="mt-4 sm:mt-6 inline-flex items-center gap-1.5 text-body-sm sm:text-body-md text-neutral-400 hover:text-primary-500 transition-colors group">
                Read more about SiteCheck
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>

              {/* ─── Trust bar ─── */}
              <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 sm:gap-x-8 gap-y-3 text-micro sm:text-body-sm text-neutral-400">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 shrink-0" />
                  Offline-first
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  Auto reports
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-500 shrink-0" />
                  Drug tracking
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
                  Audit log
                </span>
              </div>
            </div>

            {/* ─── Visual ─── */}
            <div className={`hidden lg:flex justify-center transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative w-full max-w-md">
                {/* Floating card 1 — Patient Record */}
                <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 rotate-[2deg] hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-body-sm font-bold">SC</div>
                    <div>
                      <p className="text-body-sm font-semibold text-neutral-900">SiteCheck</p>
                      <p className="text-micro text-neutral-400">Patient Record &bull; 12/05/2026</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-neutral-400">Patient</span>
                      <span className="text-neutral-900 font-medium">Amara Okafor</span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-neutral-400">Diagnosis</span>
                      <span className="text-neutral-900 font-medium">Malaria (uncomplicated)</span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-neutral-400">Treatment</span>
                      <span className="text-neutral-900 font-medium">ACT 60mg &bull; 3 days</span>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex justify-between text-body-sm">
                      <span className="text-neutral-400">Medic</span>
                      <span className="text-primary-600 font-medium">Dr. Eze</span>
                    </div>
                  </div>
                </div>

                {/* Floating card 2 — Stock alert */}
                <div className="absolute -bottom-4 -left-8 bg-white rounded-xl shadow-lg border border-neutral-100 p-4 max-w-[200px] -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary-500" />
                    <span className="text-body-sm font-semibold text-neutral-900">Stock Alert</span>
                  </div>
                  <p className="text-body-sm text-neutral-500">Artemether &mdash; <span className="text-tertiary-600 font-medium">8 remaining</span></p>
                </div>

                {/* Floating card 3 — Report */}
                <div className="absolute -top-3 -right-6 bg-white rounded-xl shadow-lg border border-neutral-100 p-4 max-w-[180px] rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-500" />
                    <span className="text-body-sm font-semibold text-neutral-900">Report Ready</span>
                  </div>
                  <p className="text-body-sm text-neutral-500">Weekly summary &bull; PDF</p>
                </div>

                {/* Glow behind cards */}
                <div className="absolute -inset-10 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-300/5 rounded-[40px] blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom bar ─── */}
      <div className={`relative shrink-0 z-10 transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between text-micro sm:text-body-sm text-neutral-400 border-t border-neutral-100/40">
          <span>&copy; {new Date().getFullYear()} SiteCheck</span>
          <span className="hidden sm:inline">NDPA compliant &bull; Nigeria</span>
        </div>
      </div>
    </div>
  )
}
