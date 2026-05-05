import type { Aircraft } from './types'

export function normalizeAdsbOne(raw: Record<string, unknown>): Aircraft | null {
  if (raw.lat == null || raw.lon == null) return null
  const altRaw = raw.alt_baro
  return {
    icao: String(raw.hex ?? '').toUpperCase(),
    callsign: String(raw.flight ?? '').trim(),
    lat: Number(raw.lat),
    lon: Number(raw.lon),
    altitudeFt: typeof altRaw === 'number' ? altRaw : 0,
    heading: Number(raw.track ?? 0),
    speedKnots: Number(raw.gs ?? 0),
    registration: raw.r ? String(raw.r) : undefined,
    aircraftType: raw.t ? String(raw.t) : undefined,
    squawk: raw.squawk ? String(raw.squawk) : undefined,
    verticalRateFpm: raw.baro_rate != null ? Number(raw.baro_rate) : undefined,
  }
}

export function normalizeAirplanesLive(raw: Record<string, unknown>): Aircraft | null {
  if (raw.lat == null || raw.lon == null) return null
  const altRaw = raw.alt_baro ?? raw.alt_geom
  return {
    icao: String(raw.hex ?? '').toUpperCase(),
    callsign: String(raw.flight ?? '').trim(),
    lat: Number(raw.lat),
    lon: Number(raw.lon),
    altitudeFt: typeof altRaw === 'number' ? altRaw : 0,
    heading: Number(raw.track ?? 0),
    speedKnots: Number(raw.gs ?? 0),
    registration: raw.r ? String(raw.r) : undefined,
    aircraftType: raw.t ? String(raw.t) : undefined,
    squawk: raw.squawk ? String(raw.squawk) : undefined,
    verticalRateFpm: raw.baro_rate != null ? Number(raw.baro_rate) : undefined,
  }
}

// OpenSky returns state vectors as arrays
export function normalizeOpenSky(raw: unknown[]): Aircraft | null {
  if (raw[8] === true || raw[5] == null || raw[6] == null) return null
  const altM = Number(raw[7] ?? 0)
  return {
    icao: String(raw[0] ?? '').toUpperCase(),
    callsign: String(raw[1] ?? '').trim(),
    lat: Number(raw[6]),
    lon: Number(raw[5]),
    altitudeFt: Math.round(altM * 3.28084),
    heading: Number(raw[10] ?? 0),
    speedKnots: Math.round(Number(raw[9] ?? 0) * 1.94384),
  }
}
