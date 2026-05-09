'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Options {
  timeout?: number
  onIdle: () => void
  events?: string[]
}

export function useIdleTimer({ timeout = 600000, onIdle, events }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onIdleRef = useRef(onIdle)

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onIdleRef.current(), timeout)
  }, [timeout])

  useEffect(() => {
    const eventList = events ?? ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    reset()
    for (const event of eventList) {
      window.addEventListener(event, reset, { passive: true })
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of eventList) {
        window.removeEventListener(event, reset)
      }
    }
  }, [reset, events])
}
