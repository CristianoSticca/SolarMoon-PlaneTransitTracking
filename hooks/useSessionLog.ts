'use client'

import { useEffect, useRef } from 'react'
import type { TransitEvent } from '@/lib/astronomy/transit'

const SESSION_KEY = 'solarmoon_session_log'
const MAX_ENTRIES = 20

export function useSessionLog(events: TransitEvent[]) {
  const seenRef = useRef(new Set<string>())

  useEffect(() => {
    if (!events.length) return
    const existing: TransitEvent[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]')
    let changed = false
    for (const ev of events) {
      const key = `${ev.aircraft.icao}-${ev.target}-${ev.contactTimestamp}`
      if (!seenRef.current.has(key)) {
        seenRef.current.add(key)
        existing.unshift(ev)
        changed = true
      }
    }
    if (changed) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(existing.slice(0, MAX_ENTRIES)))
    }
  }, [events])
}

export function getSessionLog(): TransitEvent[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]')
}
