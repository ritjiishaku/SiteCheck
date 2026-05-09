'use client'

import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FormCheckbox({ label, id, className = '', ...props }: Props) {
  return (
    <label className={`flex items-start gap-2 text-body-sm text-neutral-500 cursor-pointer min-h-[44px] py-1 ${className}`}>
      <input id={id} type="checkbox"
        className="mt-0.5 rounded-sm border-neutral-300 text-primary-500 focus:ring-primary-500 shrink-0" {...props} />
      <span>{label}</span>
    </label>
  )
}
