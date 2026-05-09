interface Props {
  quantity: number
  threshold: number
  onClickRestock?: () => void
}

type StockStatus = 'adequate' | 'low' | 'critical'

const statusClasses: Record<StockStatus, string> = {
  adequate: 'bg-secondary-50 text-secondary-900 border-secondary-300',
  low: 'bg-tertiary-50 text-tertiary-900 border-tertiary-300',
  critical: 'bg-error-bg text-error border-error',
}

const statusLabels: Record<StockStatus, string> = {
  adequate: 'In Stock',
  low: 'Low Stock',
  critical: 'Critical',
}

function getStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'critical'
  if (quantity <= threshold) return 'low'
  return 'adequate'
}

export function StockBadge({ quantity, threshold, onClickRestock }: Props) {
  const status = getStatus(quantity, threshold)
  return (
    <span
      role="status"
      aria-label={`Stock status: ${statusLabels[status]}. ${quantity} units remaining.`}
      className={`inline-flex items-center gap-2 px-[10px] py-[3px] rounded-full border text-label-sm font-medium font-sans ${statusClasses[status]}`}
    >
      {statusLabels[status]}
      {(status === 'low' || status === 'critical') && onClickRestock && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClickRestock?.() }}
          className="underline hover:no-underline text-label-sm"
        >
          Restock
        </button>
      )}
    </span>
  )
}
