'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { FlightApiResponse } from '@/lib/flights/types'

interface UseFlightsOptions {
  lat: number | null
  lon: number | null
  radiusKm: number
  enabled: boolean
}

interface UseFlightsResult {
  data: FlightApiResponse | null
  error: string | null
  loading: boolean
}

const POLL_INTERVAL_MS = 20_000

export function useFlights({ lat, lon, radiusKm, enabled }: UseFlightsOptions): UseFlightsResult {
  const [data, setData] = useState<FlightApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchFlights = useCallback(async () => {
    if (lat == null || lon == null || !enabled) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    try {
      const res = await fetch(
        `/api/flights?lat=${lat}&lon=${lon}&radius=${radiusKm}`,
        { signal: abortRef.current.signal }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: FlightApiResponse = await res.json()
      setData(json)
      setError(null)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [lat, lon, radiusKm, enabled])

  useEffect(() => {
    fetchFlights()
    const id = setInterval(fetchFlights, POLL_INTERVAL_MS)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [fetchFlights])

  return { data, error, loading }
}
