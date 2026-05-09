'use client'

import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true)
  const [showSync, setShowSync] = useState(false)

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowSync(true); setTimeout(() => setShowSync(false), 4000) }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [])

  if (isOnline && !showSync) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] px-6 py-3 text-body-md sm:text-body-md font-sans text-center border-b safe-area-top ${
        !isOnline
          ? 'bg-primary-50 text-primary-900 border-primary-300'
          : 'bg-secondary-50 text-secondary-900 border-secondary-300'
      }`}
    >
      {!isOnline
        ? 'You are offline. Your records are saved and will sync once you reconnect.'
        : 'Records synced successfully.'}
    </div>
  )
}
