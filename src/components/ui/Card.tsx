import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-sand-50 border border-neutral-100 rounded-lg p-6 shadow-md ${className}`}>
      {children}
    </div>
  )
}
