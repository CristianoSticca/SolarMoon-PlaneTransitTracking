'use client'

import { useMemo } from 'react'
import { getMoonPosition, getSunPosition } from '@/lib/astronomy/celestial'
import { detectTransits, type TransitEvent } from '@/lib/astronomy/transit'
import type { Aircraft } from '@/lib/flights/types'

interface Options {
  aircraft: Aircraft[]
  lat: number
  lon: number
  marginDeg: number
}

export function useTransitDetection({ aircraft, lat, lon, marginDeg }: Options): TransitEvent[] {
  return useMemo(() => {
    if (!aircraft.length) return []
    const now = new Date()
    const moon = getMoonPosition(lat, lon, now)
    const sun = getSunPosition(lat, lon, now)
    return detectTransits(aircraft, { lat, lon }, moon, sun, { marginDeg })
  }, [aircraft, lat, lon, marginDeg])
}
