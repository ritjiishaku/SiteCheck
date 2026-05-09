# SKILL: Component Builder

> Path: `.agents/skills/component-builder/SKILL.md`
> Use this skill whenever you are creating a new UI component for SiteCheck.
> Read fully before generating any component file.

---

## Overview

SiteCheck uses **Tailwind CSS** with a custom design token configuration.

Non-negotiable rules:
- **Font**: Plus Jakarta Sans only (set globally in `tailwind.config.ts`)
- **Surface**: `sand-50` (`#FAF8F4`) — never pure white as default surface
- **Tokens**: Mapped to Tailwind classes via `tailwind.config.ts` — never hardcode hex values
- **Types**: Full TypeScript — no `any`, explicit Props interface
- **Accessibility**: Labels, focus rings (`focus-visible:ring-2`), ARIA roles
- **Copy**: Plain Nigerian workplace English — no jargon, active verbs

---

## Tailwind Configuration

All design tokens from `.agents/rules/design-system.md` are mapped as custom Tailwind utilities:

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#E6F7F2',
          100: '#A8E0CE',
          300: '#5CBFA3',
          500: '#1A9E78',
          700: '#0D7257',
          900: '#074D3A',
        },
        secondary: {
          50: '#EBF5E0',
          100: '#B8DFA0',
          300: '#72B84A',
          500: '#3D8C18',
          700: '#266210',
          900: '#153E08',
        },
        tertiary: {
          50: '#FEF7E6',
          100: '#FDDFA0',
          300: '#F8B830',
          500: '#D48A00',
          700: '#9A6200',
          900: '#5C3A00',
        },
        neutral: {
          50: '#F4F6F8',
          100: '#DDE3EA',
          300: '#A8B6C4',
          500: '#6A7F92',
          700: '#3A4A58',
          900: '#1A2530',
        },
        sand: {
          50: '#FAF8F4',
          100: '#EDE8DC',
          300: '#CFC4A8',
          500: '#A89070',
          700: '#6E5C40',
          900: '#3A2E14',
        },
        error: {
          DEFAULT: '#E8392A',
          bg: '#FDECEA',
        },
        success: {
          DEFAULT: '#3D8C18',
          bg: '#EBF5E0',
        },
        warning: {
          DEFAULT: '#D48A00',
          bg: '#FEF7E6',
        },
        info: {
          DEFAULT: '#1A9E78',
          bg: '#E6F7F2',
        },
      },
      fontSize: {
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'display-md': ['26px', { lineHeight: '34px', fontWeight: '700' }],
        'heading-lg': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'heading-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'heading-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        label: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        micro: ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 8px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.10)',
        focus: '0 0 0 3px rgba(26,158,120,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Component Checklist

Before generating any component, confirm:

- [ ] Does the component have a typed `Props` interface?
- [ ] Are all colours from custom Tailwind classes, not raw hex?
- [ ] Is the default surface `bg-sand-50` not `bg-white`?
- [ ] Does every interactive element have `focus-visible:ring-2 focus-visible:ring-primary-500`?
- [ ] Does every form input have an associated `<label>`?
- [ ] Is the component exported as a named export?
- [ ] Is the file named in PascalCase?
- [ ] **Loading state**: Uses a spinner/overlay instead of changing button text
- [ ] **Persistence**: For forms, auto-saves draft to localStorage

---

## 1. File Naming & Location

| Component type        | Location                     | File name example        |
| --------------------- | ---------------------------- | ------------------------ |
| UI primitive          | `src/components/ui/`         | `Button.tsx`             |
| Form component        | `src/components/forms/`      | `PatientIntakeForm.tsx`  |
| Data table            | `src/components/tables/`     | `ConsultationTable.tsx`  |
| Chart / analytics     | `src/components/charts/`     | `DrugUsageChart.tsx`     |
| Layout wrapper        | `src/components/layouts/`    | `DashboardLayout.tsx`    |

---

## 2. Component Template

```typescript
// src/components/ui/Button.tsx

import type { ReactNode } from 'react'

interface Props {
  label: string
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: () => void
}

const variantClasses = {
  primary: 'bg-primary-500 text-white hover:bg-primary-700 shadow-sm',
  secondary:
    'bg-sand-50 text-primary-700 border border-primary-300 hover:bg-primary-100 shadow-sm',
  danger: 'bg-error text-white hover:bg-[#B82A1D] shadow-sm',
}

export function Button({
  label,
  children,
  variant = 'primary',
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-md text-body-md font-semibold
        min-h-[44px] transition-colors duration-150 ease-out
        focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
      `}
    >
      {children ?? label}
    </button>
  )
}
```

---

## 3. Form Component (with Offline Persistence)

```typescript
// src/components/forms/PatientIntakeForm.tsx

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

interface FormData {
  field_name: string
}

interface Props {
  formId: string
  onSubmit: (data: FormData) => Promise<void>
  isLoading?: boolean
}

export function PatientIntakeForm({ formId, onSubmit, isLoading = false }: Props) {
  const [formData, setFormData] = useState<FormData>({ field_name: '' })
  const [error, setError] = useState<string | null>(null)

  // Auto-preserve draft (AGENTS.md Rule 7)
  useEffect(() => {
    const saved = localStorage.getItem(`draft_${formId}`)
    if (saved) setFormData(JSON.parse(saved))
  }, [formId])

  useEffect(() => {
    localStorage.setItem(`draft_${formId}`, JSON.stringify(formData))
  }, [formId, formData])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await onSubmit(formData)
      localStorage.removeItem(`draft_${formId}`)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-sand-50 rounded-lg p-6 shadow-md font-sans"
    >
      <div className="mb-4">
        <label
          htmlFor="field_name"
          className="block text-body-md font-medium text-neutral-700 mb-2"
        >
          Field label
          <span className="text-tertiary-500 ml-1" aria-hidden="true">&#8226;</span>
        </label>

        <input
          id="field_name"
          type="text"
          value={formData.field_name}
          onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
          placeholder="Enter value"
          required
          className="
            w-full px-4 py-3 text-body-md font-sans
            bg-white border border-neutral-100 rounded-sm
            placeholder:text-neutral-300
            focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25
            aria-[invalid=true]:border-error
          "
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          px-6 py-3 min-h-[44px] rounded-md text-body-md font-semibold
          bg-primary-500 text-white
          hover:bg-primary-700
          focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150 ease-out relative
        `}
      >
        <span className={isLoading ? 'opacity-0' : ''}>Save record</span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            {/* Replace with actual Spinner component in production */}
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </button>
    </form>
  )
}
```

---

## 4. Drug Stock Badge

```typescript
// src/components/ui/StockBadge.tsx

interface Props {
  quantity: number
  threshold: number
}

type StockStatus = 'adequate' | 'low' | 'critical'

const statusClasses: Record<StockStatus, string> = {
  adequate: 'bg-[#EBF5E0] text-[#153E08] border-[#72B84A]',
  low:      'bg-[#FEF7E6] text-[#5C3A00] border-[#F8B830]',
  critical: 'bg-[#FDECEA] text-[#7A1010] border-[#E8392A]',
}

const statusLabels: Record<StockStatus, string> = {
  adequate: 'In Stock',
  low:      'Low Stock',
  critical: 'Critical',
}

function getStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'critical'
  if (quantity <= threshold) return 'low'
  return 'adequate'
}

export function StockBadge({ quantity, threshold }: Props) {
  const status = getStatus(quantity, threshold)

  return (
    <span
      role="status"
      aria-label={`Stock status: ${statusLabels[status]}. ${quantity} units remaining.`}
      className={`
        inline-flex items-center gap-1
        px-[10px] py-[3px] rounded-full border text-label font-medium font-sans
        ${statusClasses[status]}
      `}
    >
      {statusLabels[status]}
    </span>
  )
}
```

---

## 5. Offline Banner

```typescript
// src/components/ui/OfflineBanner.tsx

interface Props {
  isOnline: boolean
  syncComplete?: boolean
}

export function OfflineBanner({ isOnline, syncComplete = false }: Props) {
  if (isOnline && !syncComplete) return null

  const isOffline = !isOnline

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-0 left-0 right-0 z-[9999] px-6 py-3 text-body-md font-sans text-center
        border-b
        ${isOffline
          ? 'bg-info-bg text-primary-900 border-primary-300'
          : 'bg-success-bg text-secondary-900 border-secondary-300'
        }
      `}
    >
      {isOffline
        ? 'You are offline. Your records are saved and will sync once you reconnect.'
        : 'Records synced successfully.'
      }
    </div>
  )
}
```

---

## 6. Dashboard Layout

```typescript
// src/components/layouts/DashboardLayout.tsx

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title: string
  medicName: string
}

export function DashboardLayout({ children, title, medicName }: Props) {
  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen bg-neutral-50 font-sans">
      {/* Sidebar */}
      <aside className="bg-primary-900 text-white p-6">
        <h1 className="text-heading-sm font-bold mb-10">SiteCheck</h1>
        {/* Navigation... */}
      </aside>

      {/* Main Content */}
      <main className="flex flex-col">
        <header className="h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-8">
          <h2 className="text-heading-md font-semibold text-neutral-900">{title}</h2>
          <span className="text-body-md text-neutral-700">{medicName}</span>
        </header>

        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  )
}
```

---

## 7. Key Rules Summary

- Use `bg-sand-50` for cards and form surfaces — never `bg-white` as default
- Always colour-audit: no raw hex in component files (except semantic badge colours)
- Minimum button height: `min-h-[44px]`
- Required field indicator: amber dot `•` in `text-tertiary-500` — not red asterisk
- Error messages: plain English, never show error codes
- Stock alerts: always use the three-tier system (adequate / low / critical)
- All interactive elements need `aria-label` or visible `<label>`
- Focus visible ring on all interactive elements: `focus-visible:ring-2 focus-visible:ring-primary-500`

---

*skills/component-builder/SKILL.md — SiteCheck v1.0 — Rewritten for Tailwind CSS*
