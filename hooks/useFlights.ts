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

  // Keep latest values in refs so fetchFlights never needs to be recreated
  const latRef = useRef(lat)
  const lonRef = useRef(lon)
  const radiusRef = useRef(radiusKm)
  const enabledRef = useRef(enabled)
  latRef.current = lat
  lonRef.current = lon
  radiusRef.current = radiusKm
  enabledRef.current = enabled

  const fetchFlights = useCallback(async () => {
    const curLat = latRef.current
    const curLon = lonRef.current
    if (curLat == null || curLon == null || !enabledRef.current) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    try {
      const res = await fetch(
        `/api/flights?lat=${curLat}&lon=${curLon}&radius=${radiusRef.current}`,
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
  }, []) // stable — reads from refs

  useEffect(() => {
    fetchFlights()
    const id = setInterval(fetchFlights, POLL_INTERVAL_MS)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [fetchFlights]) // fetchFlights is now stable, runs only once

  return { data, error, loading }
}
