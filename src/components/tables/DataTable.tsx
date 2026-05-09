'use client'

import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T>({ columns, data, keyExtractor, onRowClick, emptyMessage = 'No records found.' }: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-body-md text-neutral-400">{emptyMessage}</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-100 text-label-sm font-semibold text-neutral-500 uppercase tracking-wide">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 text-left ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={keyExtractor(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`
                border-b border-neutral-100 text-body-md
                hover:bg-primary-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
                ${i % 2 === 0 ? 'bg-transparent' : 'bg-sand-50'}
              `}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
