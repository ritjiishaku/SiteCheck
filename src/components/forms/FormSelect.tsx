'use client'

import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

const baseClass = 'w-full px-4 py-3 text-body-md bg-white border border-neutral-100 rounded-sm placeholder:text-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all duration-200'

export function FormSelect({ label, error, id, options, className = '', ...props }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-label-sm font-medium text-neutral-700 mb-1">{label}</label>
      <select id={id} className={`${baseClass} ${error ? 'border-error' : ''} ${className}`} {...props}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-micro text-error mt-0.5">{error}</p>}
    </div>
  )
}
