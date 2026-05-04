import type { Aircraft, FlightApiResponse } from './types'
import { normalizeAdsbOne, normalizeAirplanesLive, normalizeOpenSky } from './normalizer'

const TIMEOUT_MS = 2000

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchAdsbOne(lat: number, lon: number, radiusKm: number): Promise<Aircraft[]> {
  const url = `https://api.adsb.one/v2/lat/${lat}/lon/${lon}/dist/${radiusKm}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`ADSB-One HTTP ${res.status}`)
  const data = await res.json()
  return (data.ac ?? []).map(normalizeAdsbOne).filter(Boolean) as Aircraft[]
}

export async function fetchAirplanesLive(lat: number, lon: number, radiusKm: number): Promise<Aircraft[]> {
  const url = `https://api.airplanes.live/v2/lat/${lat}/lon/${lon}/dist/${radiusKm}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`Airplanes.live HTTP ${res.status}`)
  const data = await res.json()
  return (data.ac ?? []).map(normalizeAirplanesLive).filter(Boolean) as Aircraft[]
}

export async function fetchOpenSky(lat: number, lon: number, radiusKm: number): Promise<Aircraft[]> {
  const deg = radiusKm / 111
  const params = new URLSearchParams({
    lamin: String(lat - deg), lamax: String(lat + deg),
    lomin: String(lon - deg), lomax: String(lon + deg),
  })
  const auth = process.env.OPENSKY_USERNAME
    ? `${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}@`
    : ''
  const url = `https://${auth}opensky-network.org/api/states/all?${params}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`)
  const data = await res.json()
  return (data.states ?? []).map(normalizeOpenSky).filter(Boolean) as Aircraft[]
}

export async function fetchFlightsWithFallback(
  lat: number, lon: number, radiusKm: number
): Promise<FlightApiResponse> {
  const providers: Array<{
    name: FlightApiResponse['provider']
    fn: () => Promise<Aircraft[]>
  }> = [
    { name: 'adsb-one', fn: () => fetchAdsbOne(lat, lon, radiusKm) },
    { name: 'airplanes-live', fn: () => fetchAirplanesLive(lat, lon, radiusKm) },
    { name: 'opensky', fn: () => fetchOpenSky(lat, lon, radiusKm) },
  ]

  for (const { name, fn } of providers) {
    try {
      const aircraft = await fn()
      return { aircraft, provider: name, timestamp: Date.now() }
    } catch {
      // try next provider
    }
  }
  throw new Error('All flight data providers failed')
}
