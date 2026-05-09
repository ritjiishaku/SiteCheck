'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft, ArrowRight, Building2, Users, Pill, Sparkles, Plus, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'sitecheck_onboarding'
const TOTAL_STEPS = 5

interface OnboardingData {
  step: number
  companyName: string
  siteLocation: string
  role: string
  team: { name: string; email: string }[]
  drugs: { name: string; quantity: number; unit: string }[]
  completed: boolean
}

const defaultData: OnboardingData = {
  step: 1,
  companyName: '',
  siteLocation: '',
  role: 'Medic',
  team: [],
  drugs: [],
  completed: false,
}

const steps = [
  { icon: Sparkles, label: 'Welcome' },
  { icon: Building2, label: 'Company' },
  { icon: Users, label: 'Team' },
  { icon: Pill, label: 'Inventory' },
  { icon: Check, label: 'Done' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      try { return { ...defaultData, ...JSON.parse(saved) } } catch {}
    }
    return defaultData
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  function save<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function nextStep() { setData((prev) => ({ ...prev, step: Math.min(TOTAL_STEPS, prev.step + 1) })); setMounted(false); setTimeout(() => setMounted(true), 50) }
  function prevStep() { setData((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) })); setMounted(false); setTimeout(() => setMounted(true), 50) }

  function canProceed(): boolean {
    switch (data.step) {
      case 2: return data.companyName.trim().length > 0
      default: return true
    }
  }

  async function finishOnboarding() {
    setLoading(true)
    save('completed', true)
    try {
      await fetch('/api/v1/auth/onboarding-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          company_name: data.companyName,
          site_location: data.siteLocation,
          team: data.team,
          drugs: data.drugs,
        }),
      })
    } catch { /* non-blocking */ }
    localStorage.removeItem(STORAGE_KEY)
    router.push(data.role === 'Manager' ? '/dashboard/manager' : '/dashboard/medic')
  }

  const progress = ((data.step - 1) / (TOTAL_STEPS - 1)) * 100
  const inputClass = 'w-full px-4 py-3 sm:py-3 text-body-md sm:text-body-sm bg-white/70 border border-neutral-200 rounded-lg placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm'

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

      <div className="relative shrink-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 sm:px-10 h-16">
          <span className="text-display-sm font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            SiteCheck
          </span>
          {data.step < 5 && (
            <button onClick={() => { localStorage.removeItem(STORAGE_KEY); router.push('/login') }}
              className="text-body-sm text-neutral-400 hover:text-neutral-600 transition-colors">
              Skip for now
            </button>
          )}
        </div>
      </div>

      <div className="relative shrink-0 z-10 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="h-1 bg-neutral-100/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-6 px-6 mt-6 max-w-3xl mx-auto w-full">
        {steps.map((s, i) => {
          const StepIcon = s.icon
          const isActive = data.step === i + 1
          const isDone = data.step > i + 1
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDone ? 'bg-primary-500 text-white' :
                isActive ? 'bg-neutral-900 text-white shadow-md' :
                'bg-neutral-100/60 text-neutral-300'
              }`}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-label-sm hidden sm:inline ${
                isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
              }`}>{s.label}</span>
              {i < steps.length - 1 && <span className="w-5 h-px bg-neutral-200/60 hidden sm:block" />}
            </div>
          )
        })}
      </div>

      <div className="relative flex-1 flex items-center justify-center z-10 px-4 py-8">
        <div className={`w-full max-w-lg transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {data.step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-primary-500" />
              </div>
              <h1 className="text-display-md sm:text-display-lg font-bold text-neutral-900 mb-3">
                Welcome to SiteCheck
              </h1>
              <p className="text-body-lg text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Let&apos;s get your clinic set up. We&apos;ll help you add your company, team, and inventory in just a few steps.
              </p>
              <button onClick={nextStep}
                className="mt-8 inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg min-w-[200px]">
                Let&apos;s get started <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          )}

          {data.step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-headline-md font-semibold text-neutral-900">Your company</h2>
                  <p className="text-body-sm text-neutral-500">Tell us about your clinic or organisation.</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-6 flex flex-col gap-4">
                <div>
                  <label htmlFor="oc-company" className="block text-body-md font-medium text-neutral-700 mb-1">Company name</label>
                  <input id="oc-company" type="text" value={data.companyName}
                    onChange={(e) => save('companyName', e.target.value)}
                    className={inputClass} placeholder="Eko Clinic Ltd" autoFocus />
                </div>
                <div>
                  <label htmlFor="oc-location" className="block text-body-md font-medium text-neutral-700 mb-1">Site location</label>
                  <input id="oc-location" type="text" value={data.siteLocation}
                    onChange={(e) => save('siteLocation', e.target.value)}
                    className={inputClass} placeholder="Lagos, Nigeria" />
                </div>
                <div>
                  <label htmlFor="oc-role" className="block text-body-md font-medium text-neutral-700 mb-1">Your role</label>
                  <select id="oc-role" value={data.role} onChange={(e) => save('role', e.target.value)}
                    className={inputClass}>
                    <option value="Medic">Medic</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {data.step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-headline-md font-semibold text-neutral-900">Your team</h2>
                  <p className="text-body-sm text-neutral-500">Add other medics at your clinic. You can skip this and add them later.</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-4 sm:p-6 flex flex-col gap-3">
                {data.team.map((member, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 bg-white border border-neutral-100 rounded-lg p-3 sm:p-0 sm:bg-transparent sm:border-0">
                    <div className="flex-1">
                      <label className="text-label-sm text-neutral-500 block mb-0.5">Name</label>
                      <input type="text" value={member.name}
                        onChange={(e) => {
                          const team = [...data.team]
                          team[i] = { ...team[i], name: e.target.value }
                          save('team', team)
                        }}
                        className={inputClass} placeholder="Dr. Name" />
                    </div>
                    <div className="flex-1">
                      <label className="text-label-sm text-neutral-500 block mb-0.5">Email</label>
                      <input type="email" value={member.email}
                        onChange={(e) => {
                          const team = [...data.team]
                          team[i] = { ...team[i], email: e.target.value }
                          save('team', team)
                        }}
                        className={inputClass} placeholder="name@company.ng" />
                    </div>
                    <button onClick={() => save('team', data.team.filter((_, j) => j !== i))}
                      className="flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-error transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => save('team', [...data.team, { name: '', email: '' }])}
                  className="inline-flex items-center gap-2 text-body-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors py-2">
                  <Plus className="h-3.5 w-3.5" /> Add another medic
                </button>
              </div>
            </div>
          )}

          {data.step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-headline-md font-semibold text-neutral-900">Drug inventory</h2>
                  <p className="text-body-sm text-neutral-500">Add the drugs you stock regularly. You can always add more later.</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg shadow-neutral-200/30 p-4 sm:p-6 flex flex-col gap-3">
                {data.drugs.map((drug, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 bg-white border border-neutral-100 rounded-lg p-3 sm:p-0 sm:bg-transparent sm:border-0">
                    <div className="flex-[2]">
                      <label className="text-label-sm text-neutral-500 block mb-0.5">Drug name</label>
                      <input type="text" value={drug.name}
                        onChange={(e) => {
                          const drugs = [...data.drugs]
                          drugs[i] = { ...drugs[i], name: e.target.value }
                          save('drugs', drugs)
                        }}
                        className={inputClass} placeholder="Paracetamol" />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-1 sm:w-20">
                        <label className="text-label-sm text-neutral-500 block mb-0.5">Qty</label>
                        <input type="number" value={drug.quantity || ''}
                          onChange={(e) => {
                            const drugs = [...data.drugs]
                            drugs[i] = { ...drugs[i], quantity: Number(e.target.value) }
                            save('drugs', drugs)
                          }}
                          className={inputClass} />
                      </div>
                      <div className="w-24">
                        <label className="text-label-sm text-neutral-500 block mb-0.5">Unit</label>
                        <select value={drug.unit}
                          onChange={(e) => {
                            const drugs = [...data.drugs]
                            drugs[i] = { ...drugs[i], unit: e.target.value }
                            save('drugs', drugs)
                          }}
                          className={inputClass}>
                          <option>tablets</option>
                          <option>vials</option>
                          <option>sachets</option>
                        </select>
                      </div>
                      <button onClick={() => save('drugs', data.drugs.filter((_, j) => j !== i))}
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-error transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => save('drugs', [...data.drugs, { name: '', quantity: 0, unit: 'tablets' }])}
                  className="inline-flex items-center gap-2 text-body-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors py-2">
                  <Plus className="h-3.5 w-3.5" /> Add another drug
                </button>
              </div>
            </div>
          )}

          {data.step === 5 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-secondary-500" />
              </div>
              <h1 className="text-display-md sm:text-display-lg font-bold text-neutral-900 mb-3">
                You&apos;re all set!
              </h1>
              <p className="text-body-lg text-neutral-500 max-w-sm mx-auto leading-relaxed mb-8">
                Here&apos;s what you&apos;ve set up:
              </p>
              <div className="bg-white/70 backdrop-blur-xl border border-neutral-100/60 rounded-2xl shadow-lg p-6 text-left mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-body-sm text-neutral-500">Company</p>
                    <p className="text-body-md font-semibold text-neutral-900">{data.companyName || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-body-sm text-neutral-500">Team members added</p>
                    <p className="text-body-md font-semibold text-neutral-900">{data.team.filter((t) => t.name).length || 'None'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="text-body-sm text-neutral-500">Drugs in inventory</p>
                    <p className="text-body-md font-semibold text-neutral-900">{data.drugs.filter((d) => d.name).length || 'None'}</p>
                  </div>
                </div>
              </div>
              <button onClick={finishOnboarding} disabled={loading}
                className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full bg-neutral-900 text-white text-body-md font-semibold hover:bg-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg min-w-[220px] disabled:opacity-50">
                {loading ? 'Setting up...' : 'Go to dashboard'} <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          )}

          {data.step >= 2 && data.step <= 4 && (
            <div className="flex items-center justify-between mt-8">
              <button onClick={prevStep}
                className="inline-flex items-center gap-2 text-body-md text-neutral-500 hover:text-neutral-700 transition-colors py-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                {data.step < 4 && (
                  <button onClick={nextStep}
                    className="text-body-sm text-neutral-400 hover:text-neutral-600 transition-colors py-2">
                    Skip
                  </button>
                )}
                <button onClick={nextStep} disabled={!canProceed()}
                  className={`inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full text-body-md font-semibold transition-all duration-300 ${
                    canProceed()
                      ? 'bg-neutral-900 text-white hover:bg-neutral-700 shadow-sm hover:shadow-md'
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  }`}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
