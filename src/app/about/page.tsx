'use client'

import { useState, startTransition } from 'react'
import Link from 'next/link'
import { Shield, ArrowRight, Wifi, FileText, Package, BarChart3, Clock, Quote, Menu, X } from 'lucide-react'

const features = [
  { icon: Wifi, title: 'Offline-first', description: 'Full functionality without internet. Saves locally, syncs silently when connection returns.' },
  { icon: FileText, title: 'One-click reports', description: 'Daily, weekly, monthly, or custom. Export as PDF or Excel. Email with one click.' },
  { icon: Package, title: 'Live drug inventory', description: 'Automatic deduction on dispense. Colour-coded alerts for low and critical stock.' },
  { icon: BarChart3, title: 'Manager dashboard', description: 'Patient volume, drug usage, and medic performance across your company in real time.' },
  { icon: Clock, title: 'Session-safe', description: 'Auto-lock after 10 minutes inactivity. Unsaved data preserved on interruption.' },
  { icon: Shield, title: 'NDPA compliant', description: 'Data encrypted at rest and in transit. Full audit log. Archive-only — no deletion.' },
]

const steps = [
  { step: '01', title: 'Consult & record', description: 'Enter vitals, diagnosis, and prescription directly into SiteCheck — on paper or digitally.' },
  { step: '02', title: 'Dispense & track', description: 'Drugs deducted from inventory automatically. Stock updates across all sites in real time.' },
  { step: '03', title: 'Report & manage', description: 'Managers generate reports instantly. No more Excel files or chasing medics for data.' },
]

export default function AboutPage() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  if (!mounted) startTransition(() => setMounted(true))

  return (
    <div className="font-sans bg-neutral-50 text-neutral-700">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-10 h-14 sm:h-16">
          <Link href="/" className="text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            SiteCheck
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <a href="/login" className="text-body-md text-neutral-500 hover:text-neutral-900 transition-colors px-4 py-2">Sign in</a>
            <a href="/signup"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-sm hover:shadow-md">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
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
          <div className="sm:hidden fixed inset-0 z-40" onClick={() => setMobileMenu(false)} aria-hidden="true" />
        )}

        {/* Mobile dropdown */}
        {mobileMenu && (
          <div className="sm:hidden fixed top-14 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-neutral-100 shadow-lg animate-[fadeIn_150ms_ease-out]">
            <div className="px-4 py-6 flex flex-col gap-3">
              <a href="/login" onClick={() => setMobileMenu(false)}
                className="flex items-center justify-center min-h-[48px] px-6 rounded-full border border-neutral-200 text-neutral-700 text-body-md font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-colors w-full">
                Sign in
              </a>
              <a href="/signup" onClick={() => setMobileMenu(false)}
                className="flex items-center justify-center min-h-[48px] px-6 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-colors w-full">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className={`py-16 sm:py-28 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50/80 border border-primary-100 text-body-sm font-medium text-primary-700 mb-6 backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5" />
            NDPA compliant &middot; Made for Nigeria
          </div>
          <h1 className="text-[32px] sm:text-[48px] font-bold text-neutral-900 leading-[1.1] tracking-tight">
            SiteCheck eliminates the{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">double-entry problem</span>
            {' '}for Nigerian site medics.
          </h1>
          <p className="mt-4 sm:mt-5 text-body-md sm:text-body-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Medics consult patients on paper, re-enter data into Excel, and email reports to managers.
            SiteCheck replaces all three steps with a single digital workflow.
            One entry. Automatic reports. Live drug stock. Real-time manager dashboard.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <a href="/signup"
              className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a href="/login"
              className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full border border-neutral-200 bg-white text-neutral-700 text-body-md font-semibold hover:border-neutral-300 hover:text-neutral-900 transition-all duration-300 w-full sm:w-auto">
              Sign in
            </a>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-display-md sm:text-display-lg font-bold text-neutral-900">Everything you need to run your clinic</h2>
            <p className="mt-3 sm:mt-4 text-body-md sm:text-body-lg text-neutral-500">Built for the way Nigerian site medics actually work.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title}
                  className="group bg-sand-50 border border-neutral-100 rounded-xl p-7 shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-200">
                  <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-headline-md font-semibold text-neutral-900 mb-2">{f.title}</h3>
                  <p className="text-body-md text-neutral-500 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-display-md sm:text-display-lg font-bold text-neutral-900">Three simple steps</h2>
            <p className="mt-3 sm:mt-4 text-body-md sm:text-body-lg text-neutral-500">Replace hours of paperwork with a single digital workflow.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-5 text-headline-md font-bold shadow-md">
                  {item.step}
                </div>
                <h3 className="text-headline-md font-semibold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-body-md text-neutral-500 leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─── */}
      <section className="py-16 sm:py-28 bg-sand-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Quote className="h-8 w-8 text-primary-200 mx-auto mb-6" />
          <blockquote className="text-headline-md sm:text-display-sm text-neutral-700 leading-relaxed font-medium">
            &ldquo;SiteCheck cut our reporting time from hours to minutes. Our medics love that it works even in areas with poor network.&rdquo;
          </blockquote>
          <div className="mt-6">
            <p className="text-body-md font-semibold text-neutral-900">Dr. Chidi Okafor</p>
            <p className="text-body-sm text-neutral-500">Clinic Manager, NigerDelta Health Services</p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-28 bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-display-md sm:text-display-lg font-bold text-white">Ready to eliminate double-entry?</h2>
          <p className="mt-3 sm:mt-4 text-body-md sm:text-body-lg text-neutral-400 max-w-lg mx-auto">
            Join site medics across Nigeria using SiteCheck. No internet required.
          </p>
          <a href="/signup"
            className="mt-6 sm:mt-8 inline-flex items-center justify-center min-h-[48px] px-10 py-3 rounded-full bg-white text-neutral-900 text-body-md font-semibold hover:bg-neutral-100 transition-all duration-300 shadow-lg w-full sm:w-auto">
            Get started free <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-10 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <Link href="/" className="text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">SiteCheck</Link>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-body-sm text-neutral-400">
              <a href="/about" className="hover:text-neutral-700 transition-colors">About</a>
              <span>&copy; {new Date().getFullYear()} SiteCheck.</span>
              <span>NDPA compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
