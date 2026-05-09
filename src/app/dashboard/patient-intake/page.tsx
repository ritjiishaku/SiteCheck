'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'
import { saveDraft, loadDraft, clearDraft } from '@/lib/offline/draftStorage'
import { addToSyncQueue } from '@/lib/offline/syncManager'

const FORM_ID = 'patient-intake'

interface DrugLine {
  drug_name: string
  quantity: number
  unit: string
}

interface FormData {
  full_name: string
  staff_code: string
  serial_number: string
  age: string
  gender: string
  department: string
  company_name: string
  date_of_visit: string
  time_of_visit: string
  complaints: string
  blood_pressure: string
  pulse_rate: string
  temperature: string
  respiratory_rate: string
  oxygen_saturation: string
  weight: string
  height: string
  bmi: string
  diagnosis: string
  treatment: string
}

function calcBMI(weight: number, height: number): string {
  if (!weight || !height) return ''
  const hMetres = height / 100
  return (weight / (hMetres * hMetres)).toFixed(1)
}

function nowDate(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface UserProfile {
  medic_id: string
  full_name: string
  role: string
  company_name: string
}

export default function PatientIntakePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<FormData>(() => {
    const saved = loadDraft<FormData>(FORM_ID)
    return saved ?? {
      full_name: '', staff_code: '', serial_number: '', age: '', gender: 'Male',
      department: '', company_name: '', date_of_visit: nowDate(), time_of_visit: nowTime(),
      complaints: '', blood_pressure: '', pulse_rate: '', temperature: '',
      respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', bmi: '',
      diagnosis: '', treatment: '',
    }
  })
  const [drugs, setDrugs] = useState<DrugLine[]>([{ drug_name: '', quantity: 0, unit: 'tablets' }])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error'>('info')
  const nameRef = useRef<HTMLInputElement>(null)
  const userFetched = useRef(false)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (userFetched.current) return
    userFetched.current = true
    async function loadUser() {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) {
          setUser(data.data)
          setForm((prev) => ({ ...prev, company_name: data.data.company_name }))
        }
      } catch {
        // silent
      } finally {
        setPageLoading(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => { saveDraft(FORM_ID, form) }, [form])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if ((key === 'weight' || key === 'height') && next.weight && next.height) {
        next.bmi = calcBMI(Number(next.weight), Number(next.height))
      }
      return next
    })
  }

  function updateDrug(index: number, key: keyof DrugLine, value: string | number) {
    setDrugs((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  function addDrug() {
    setDrugs((prev) => [...prev, { drug_name: '', quantity: 0, unit: 'tablets' }])
  }

  function removeDrug(index: number) {
    setDrugs((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const payload = {
      full_name: form.full_name,
      staff_code: form.staff_code,
      age: Number(form.age),
      gender: form.gender,
      department: form.department,
      date_of_visit: form.date_of_visit,
      time_of_visit: form.time_of_visit,
      complaints: form.complaints,
      diagnosis: form.diagnosis,
      treatment: form.treatment,
      vital_signs: {
        blood_pressure: form.blood_pressure || undefined,
        pulse_rate: form.pulse_rate ? Number(form.pulse_rate) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        respiratory_rate: form.respiratory_rate ? Number(form.respiratory_rate) : undefined,
        oxygen_saturation: form.oxygen_saturation ? Number(form.oxygen_saturation) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
      },
      drugs_dispensed: drugs
        .filter((d) => d.drug_name && d.quantity > 0)
        .map((d) => ({ drug_name: d.drug_name, quantity_dispensed: d.quantity, unit: d.unit })),
    }

    if (!navigator.onLine) {
      addToSyncQueue({
        url: '/api/v1/patients',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        payload,
      })
      clearDraft(FORM_ID)
      setMessageType('info')
      setMessage('Saved offline. Will sync when reconnected.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/v1/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        clearDraft(FORM_ID)
        setForm({
          full_name: '', staff_code: '', serial_number: '', age: '', gender: 'Male',
          department: '', company_name: '', date_of_visit: nowDate(), time_of_visit: nowTime(),
          complaints: '', blood_pressure: '', pulse_rate: '', temperature: '',
          respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', bmi: '',
          diagnosis: '', treatment: '',
        })
        setDrugs([{ drug_name: '', quantity: 0, unit: 'tablets' }])
        setMessageType('success')
        setMessage('Patient record saved.')
        nameRef.current?.focus()
      } else {
        setMessageType('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setMessageType('error')
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 input-mobile-safe'
  const labelClass = 'block text-body-md font-medium text-neutral-700 mb-1'
  const reqDot = <span className="text-tertiary-500" aria-hidden="true">&bull;</span>

  return (
    <DashboardLayout title="New Patient" medicName={user?.full_name || 'Loading...'} role={user?.role || 'Medic'}>
      {pageLoading ? (
        <div className="flex items-center justify-center py-20 text-body-md text-neutral-400">Loading...</div>
      ) : (
      <div className="max-w-3xl bg-sand-50 rounded-lg p-4 sm:p-6 shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Patient Info ── */}
          <fieldset>
            <legend className="text-headline-md font-semibold text-neutral-900 mb-4">Patient Information</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="full_name" className={labelClass}>Full name {reqDot}</label>
                <input id="full_name" ref={nameRef} type="text" value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)} required className={inputClass} placeholder="Patient full name" />
              </div>
              <div>
                <label htmlFor="staff_code" className={labelClass}>Staff code {reqDot}</label>
                <input id="staff_code" type="text" value={form.staff_code}
                  onChange={(e) => update('staff_code', e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="serial_number" className={labelClass}>Serial number</label>
                <input id="serial_number" type="text" value={form.serial_number}
                  onChange={(e) => update('serial_number', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="age" className={labelClass}>Age {reqDot}</label>
                <input id="age" type="number" value={form.age}
                  onChange={(e) => update('age', e.target.value)} required className={inputClass} min={0} max={150} />
              </div>
              <div>
                <label htmlFor="gender" className={labelClass}>Gender {reqDot}</label>
                <select id="gender" value={form.gender}
                  onChange={(e) => update('gender', e.target.value)} required className={inputClass}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="department" className={labelClass}>Department {reqDot}</label>
                <input id="department" type="text" value={form.department}
                  onChange={(e) => update('department', e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="company_name" className={labelClass}>Company {reqDot}</label>
                <input id="company_name" type="text" value={form.company_name} readOnly tabIndex={-1}
                  required className={inputClass + ' bg-neutral-50 text-neutral-500 cursor-default'} />
              </div>
              <div>
                <label htmlFor="date_of_visit" className={labelClass}>Date of visit {reqDot}</label>
                <input id="date_of_visit" type="text" value={form.date_of_visit}
                  onChange={(e) => update('date_of_visit', e.target.value)} required className={inputClass} placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="time_of_visit" className={labelClass}>Time of visit {reqDot}</label>
                <input id="time_of_visit" type="text" value={form.time_of_visit}
                  onChange={(e) => update('time_of_visit', e.target.value)} required className={inputClass} placeholder="HH:MM WAT" />
              </div>
            </div>
          </fieldset>

          {/* ── Vital Signs ── */}
          <fieldset>
            <legend className="text-headline-md font-semibold text-neutral-900 mb-4">Vital Signs</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label htmlFor="blood_pressure" className={labelClass}>Blood pressure</label>
                <input id="blood_pressure" type="text" value={form.blood_pressure}
                  onChange={(e) => update('blood_pressure', e.target.value)} className={inputClass} placeholder="120/80 mmHg" />
              </div>
              <div>
                <label htmlFor="pulse_rate" className={labelClass}>Pulse rate</label>
                <input id="pulse_rate" type="number" value={form.pulse_rate}
                  onChange={(e) => update('pulse_rate', e.target.value)} className={inputClass} placeholder="bpm" />
              </div>
              <div>
                <label htmlFor="temperature" className={labelClass}>Temperature</label>
                <input id="temperature" type="number" step="0.1" value={form.temperature}
                  onChange={(e) => update('temperature', e.target.value)} className={inputClass} placeholder="&deg;C" />
              </div>
              <div>
                <label htmlFor="respiratory_rate" className={labelClass}>Respiratory rate</label>
                <input id="respiratory_rate" type="number" value={form.respiratory_rate}
                  onChange={(e) => update('respiratory_rate', e.target.value)} className={inputClass} placeholder="breaths/min" />
              </div>
              <div>
                <label htmlFor="oxygen_saturation" className={labelClass}>O&sup2; saturation</label>
                <input id="oxygen_saturation" type="number" value={form.oxygen_saturation}
                  onChange={(e) => update('oxygen_saturation', e.target.value)} className={inputClass} placeholder="%" />
              </div>
              <div>
                <label htmlFor="weight" className={labelClass}>Weight</label>
                <input id="weight" type="number" step="0.1" value={form.weight}
                  onChange={(e) => update('weight', e.target.value)} className={inputClass} placeholder="kg" />
              </div>
              <div>
                <label htmlFor="height" className={labelClass}>Height</label>
                <input id="height" type="number" step="0.1" value={form.height}
                  onChange={(e) => update('height', e.target.value)} className={inputClass} placeholder="cm" />
              </div>
              <div>
                <label htmlFor="bmi" className={labelClass}>BMI</label>
                <input id="bmi" type="text" value={form.bmi} readOnly
                  className={inputClass + ' bg-neutral-50 text-neutral-500 cursor-default'} placeholder="Auto-calc" />
              </div>
            </div>
          </fieldset>

          {/* ── Consultation ── */}
          <fieldset>
            <legend className="text-headline-md font-semibold text-neutral-900 mb-4">Consultation</legend>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="complaints" className={labelClass}>Complaints {reqDot}</label>
                <textarea id="complaints" value={form.complaints}
                  onChange={(e) => update('complaints', e.target.value)} required rows={3} className={inputClass + ' resize-y'} />
              </div>
              <div>
                <label htmlFor="diagnosis" className={labelClass}>Diagnosis {reqDot}</label>
                <textarea id="diagnosis" value={form.diagnosis}
                  onChange={(e) => update('diagnosis', e.target.value)} required rows={3} className={inputClass + ' resize-y'} />
              </div>
              <div>
                <label htmlFor="treatment" className={labelClass}>Treatment {reqDot}</label>
                <textarea id="treatment" value={form.treatment}
                  onChange={(e) => update('treatment', e.target.value)} required rows={3} className={inputClass + ' resize-y'} />
              </div>
            </div>
          </fieldset>

          {/* ── Drugs Dispensed ── */}
          <fieldset>
            <legend className="text-headline-md font-semibold text-neutral-900 mb-4">
              Drugs Dispensed
              <button type="button" onClick={addDrug}
                className="ml-3 inline-flex items-center gap-1 text-body-sm text-primary-500 font-semibold hover:text-primary-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add drug
              </button>
            </legend>
            <div className="flex flex-col gap-3">
              {drugs.map((drug, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 bg-white border border-neutral-100 rounded-sm p-3 sm:p-0 sm:bg-transparent sm:border-0">
                  <div className="flex-1 min-w-0">
                    <label className="text-label-sm text-neutral-500 mb-0.5 block">Drug name {reqDot}</label>
                    <input type="text" value={drug.drug_name}
                      onChange={(e) => updateDrug(i, 'drug_name', e.target.value)}
                      className={inputClass} placeholder="Paracetamol" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 sm:w-24">
                      <label className="text-label-sm text-neutral-500 mb-0.5 block">Qty {reqDot}</label>
                      <input type="number" value={drug.quantity || ''}
                        onChange={(e) => updateDrug(i, 'quantity', Number(e.target.value))}
                        className={inputClass} min={0} />
                    </div>
                    <div className="flex-1 sm:w-28">
                      <label className="text-label-sm text-neutral-500 mb-0.5 block">Unit</label>
                      <select value={drug.unit}
                        onChange={(e) => updateDrug(i, 'unit', e.target.value)} className={inputClass}>
                        <option value="tablets">tablets</option>
                        <option value="vials">vials</option>
                        <option value="sachets">sachets</option>
                        <option value="capsules">capsules</option>
                        <option value="ampoules">ampoules</option>
                        <option value="ml">ml</option>
                        <option value="mg">mg</option>
                      </select>
                    </div>
                    {drugs.length > 1 && (
                      <button type="button" onClick={() => removeDrug(i)}
                        aria-label="Remove drug"
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-neutral-400 hover:text-error transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {message && (
            <p className={`text-body-sm px-4 py-2 rounded-sm ${
              messageType === 'success' ? 'text-secondary-900 bg-secondary-50' :
              messageType === 'info' ? 'text-primary-700 bg-primary-50' :
              'text-error bg-error-bg'
            }`}>
              {message}
            </p>
          )}

          <Button type="submit" label="Save record" loading={loading}>Save record</Button>
        </form>
      </div>
      )}
    </DashboardLayout>
  )
}
