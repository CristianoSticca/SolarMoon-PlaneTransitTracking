'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export function useWakeLock() {
  const [active, setActive] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' && 'wakeLock' in navigator
  )
  const lockRef = useRef<WakeLockSentinel | null>(null)

  const enable = useCallback(async () => {
    if (!supported) return
    try {
      const nav = navigator as Navigator & { wakeLock: { request(type: 'screen'): Promise<WakeLockSentinel> } }
      lockRef.current = await nav.wakeLock.request('screen')
      lockRef.current.addEventListener('release', () => setActive(false))
      setActive(true)
    } catch {
      // Wake lock denied (e.g. battery saver mode) — fail silently
    }
  }, [supported])

  const disable = useCallback(() => {
    lockRef.current?.release()
    lockRef.current = null
    setActive(false)
  }, [])

  const toggle = useCallback(() => {
    active ? disable() : enable()
  }, [active, enable, disable])

  // Re-acquire wake lock when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (active && document.visibilityState === 'visible') enable()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [active, enable])

  return { active, supported, toggle }
}
