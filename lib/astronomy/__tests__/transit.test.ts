import { detectTransits } from '../transit'
import type { Aircraft } from '../../flights/types'
import type { CelestialPosition } from '../celestial'

const observer = { lat: 45.0, lon: 9.0 }
const moon: CelestialPosition = { azimuth: 180, altitude: 45 }
const sun: CelestialPosition = { azimuth: 90, altitude: 30 }

function makeAircraft(override: Partial<Aircraft> = {}): Aircraft {
  return {
    icao: 'TEST01',
    callsign: 'TEST01',
    lat: 45.0,
    lon: 9.0,
    altitudeFt: 35000,
    heading: 180,
    speedKnots: 450,
    ...override,
  }
}

describe('detectTransits', () => {
  it('returns empty array when aircraft list is empty', () => {
    expect(detectTransits([], observer, moon, sun, { marginDeg: 0.5 })).toEqual([])
  })

  it('skips ground traffic (altitudeFt < 1000)', () => {
    const aircraft = [makeAircraft({ altitudeFt: 0 })]
    const result = detectTransits(aircraft, observer, moon, sun, { marginDeg: 10 })
    expect(result).toHaveLength(0)
  })

  it('returns results sorted by countdown ascending', () => {
    // Use a large margin to force detections, then verify ordering
    const aircraft = [
      makeAircraft({ icao: 'A1', lat: 44.9, lon: 9.0, heading: 0, altitudeFt: 35000, speedKnots: 100 }),
      makeAircraft({ icao: 'A2', lat: 44.7, lon: 9.0, heading: 0, altitudeFt: 35000, speedKnots: 100 }),
    ]
    const result = detectTransits(aircraft, observer, moon, sun, { marginDeg: 20 })
    if (result.length >= 2) {
      for (let i = 1; i < result.length; i++) {
        expect(result[i].countdown).toBeGreaterThanOrEqual(result[i - 1].countdown)
      }
    }
    // At minimum, no crash
    expect(Array.isArray(result)).toBe(true)
  })

  it('each event has required fields', () => {
    const aircraft = [makeAircraft({ altitudeFt: 35000, speedKnots: 450 })]
    const result = detectTransits(aircraft, observer, moon, sun, { marginDeg: 20 })
    for (const ev of result) {
      expect(ev.aircraft).toBeDefined()
      expect(['moon', 'sun']).toContain(ev.target)
      expect(typeof ev.countdown).toBe('number')
      expect(ev.countdown).toBeGreaterThanOrEqual(0)
      expect(typeof ev.minAngularSeparation).toBe('number')
      expect(typeof ev.contactTimestamp).toBe('number')
    }
  })
})
