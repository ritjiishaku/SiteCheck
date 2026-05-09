import type { ReactNode } from 'react'

interface Props {
  label: string
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
}

const variantClasses = {
  primary: 'bg-primary-500 text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-sand-50 text-primary-700 border border-primary-300 hover:bg-primary-100 shadow-sm',
  danger: 'bg-error text-white hover:bg-[#B82A1D] shadow-sm',
}

export function Button({
  label, children, variant = 'primary', type = 'button',
  disabled = false, loading = false, onClick, className = '',
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={label}
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-md text-body-md font-semibold
        min-h-[44px] transition-colors duration-150 ease-out
        focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed relative
        ${variantClasses[variant]} ${className}
      `}
    >
      <span className={loading ? 'opacity-0' : ''}>{children ?? label}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      )}
    </button>
  )
}
