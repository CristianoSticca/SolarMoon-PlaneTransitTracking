import type { Aircraft } from '../flights/types'
import type { CelestialPosition } from './celestial'

export interface TransitEvent {
  aircraft: Aircraft
  target: 'moon' | 'sun'
  contactTimestamp: number   // ms since epoch
  countdown: number          // seconds until contact
  minAngularSeparation: number  // degrees
}

export interface NearbyAircraft {
  aircraft: Aircraft
  target: 'moon' | 'sun'
  currentSeparationDeg: number
  minProjectedSeparationDeg: number
}

interface Observer {
  lat: number
  lon: number
}

const R_EARTH = 6371000  // meters

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const lat1R = lat1 * Math.PI / 180
  const lat2R = lat2 * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2R)
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLon)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function aircraftAngularPos(
  observer: Observer,
  aircraftLat: number, aircraftLon: number, altitudeFt: number
): CelestialPosition {
  const altM = altitudeFt * 0.3048
  const horizDist = haversineDistance(observer.lat, observer.lon, aircraftLat, aircraftLon)
  const elevationDeg = Math.atan2(altM, Math.max(horizDist, 1)) * 180 / Math.PI
  const az = bearing(observer.lat, observer.lon, aircraftLat, aircraftLon)
  return { azimuth: az, altitude: elevationDeg }
}

function angularSeparation(a: CelestialPosition, b: CelestialPosition): number {
  const alt1 = a.altitude * Math.PI / 180
  const alt2 = b.altitude * Math.PI / 180
  const dAz = (a.azimuth - b.azimuth) * Math.PI / 180
  const cosD = Math.sin(alt1) * Math.sin(alt2) + Math.cos(alt1) * Math.cos(alt2) * Math.cos(dAz)
  return Math.acos(Math.max(-1, Math.min(1, cosD))) * 180 / Math.PI
}

function projectPosition(aircraft: Aircraft, seconds: number): { lat: number; lon: number } {
  const speedMs = aircraft.speedKnots * 0.514444
  const distM = speedMs * seconds
  const headRad = aircraft.heading * Math.PI / 180
  const lat = aircraft.lat + (distM * Math.cos(headRad)) / R_EARTH * (180 / Math.PI)
  const lon = aircraft.lon + (distM * Math.sin(headRad)) / (R_EARTH * Math.cos(aircraft.lat * Math.PI / 180)) * (180 / Math.PI)
  return { lat, lon }
}

export function detectTransits(
  aircraft: Aircraft[],
  observer: Observer,
  moon: CelestialPosition,
  sun: CelestialPosition,
  options: { marginDeg: number }
): { events: TransitEvent[]; nearby: NearbyAircraft[] } {
  const { marginDeg } = options
  const now = Date.now()
  const HORIZON_S = 600  // 10 minutes
  const STEP_S = 5
  const events: TransitEvent[] = []
  const nearby: NearbyAircraft[] = []

  for (const ac of aircraft) {
    if (ac.altitudeFt < 1000) continue  // skip ground traffic

    for (const [target, celestial] of [['moon', moon], ['sun', sun]] as const) {
      let minSep = Infinity
      let contactSeconds = -1
      const currentSep = angularSeparation(aircraftAngularPos(observer, ac.lat, ac.lon, ac.altitudeFt), celestial)

      for (let s = 0; s <= HORIZON_S; s += STEP_S) {
        const { lat, lon } = projectPosition(ac, s)
        const acPos = aircraftAngularPos(observer, lat, lon, ac.altitudeFt)
        const sep = angularSeparation(acPos, celestial)

        if (sep < minSep) minSep = sep
        if (sep < marginDeg && contactSeconds < 0) contactSeconds = s

        if (sep > minSep + Math.max(marginDeg * 0.5, 0.3) && contactSeconds >= 0) break
      }

      if (contactSeconds >= 0 && minSep < marginDeg) {
        events.push({
          aircraft: ac,
          target,
          contactTimestamp: now + contactSeconds * 1000,
          countdown: contactSeconds,
          minAngularSeparation: minSep,
        })
      } else {
        nearby.push({
          aircraft: ac,
          target,
          currentSeparationDeg: currentSep,
          minProjectedSeparationDeg: minSep === Infinity ? currentSep : minSep,
        })
      }
    }
  }

  // Keep top 5 nearest per target, sorted by min projected separation
  const topNearby = nearby
    .sort((a, b) => a.minProjectedSeparationDeg - b.minProjectedSeparationDeg)
    .slice(0, 10)

  return {
    events: events.sort((a, b) => a.countdown - b.countdown),
    nearby: topNearby,
  }
}
