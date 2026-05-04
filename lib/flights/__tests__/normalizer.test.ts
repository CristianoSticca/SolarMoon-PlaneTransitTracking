import { normalizeAdsbOne, normalizeAirplanesLive, normalizeOpenSky } from '../normalizer'
import type { Aircraft } from '../types'

const expectedBase: Aircraft = {
  icao: 'ABC123',
  callsign: 'FR4521',
  lat: 45.1,
  lon: 9.2,
  altitudeFt: 35000,
  heading: 270,
  speedKnots: 450,
}

describe('normalizeAdsbOne', () => {
  it('maps ADSB-One response to Aircraft', () => {
    const raw = {
      hex: 'ABC123',
      flight: 'FR4521  ',
      lat: 45.1,
      lon: 9.2,
      alt_baro: 35000,
      track: 270,
      gs: 450,
    }
    expect(normalizeAdsbOne(raw)).toEqual(expectedBase)
  })

  it('returns null for aircraft without position', () => {
    expect(normalizeAdsbOne({ hex: 'ABC123' })).toBeNull()
  })
})

describe('normalizeAirplanesLive', () => {
  it('maps Airplanes.live response to Aircraft', () => {
    const raw = {
      hex: 'ABC123',
      flight: 'FR4521  ',
      lat: 45.1,
      lon: 9.2,
      alt_baro: 35000,
      track: 270,
      gs: 450,
    }
    expect(normalizeAirplanesLive(raw)).toEqual(expectedBase)
  })

  it('returns null for aircraft without position', () => {
    expect(normalizeAirplanesLive({ hex: 'ABC123' })).toBeNull()
  })
})

describe('normalizeOpenSky', () => {
  it('maps OpenSky state vector to Aircraft', () => {
    // OpenSky: [icao24, callsign, origin_country, time_pos, last_contact, lon, lat, baro_alt, on_ground, velocity, true_track, ...]
    const raw = ['abc123', 'FR4521  ', 'Italy', 0, 0, 9.2, 45.1, 10668, false, 231.6, 270, 0]
    const result = normalizeOpenSky(raw)
    expect(result?.icao).toBe('ABC123')
    expect(result?.callsign).toBe('FR4521')
    expect(result?.lat).toBeCloseTo(45.1)
    expect(result?.lon).toBeCloseTo(9.2)
    expect(result?.heading).toBe(270)
  })

  it('returns null for on-ground aircraft', () => {
    const raw = ['abc123', 'FR4521', 'Italy', 0, 0, 9.2, 45.1, 0, true, 0, 0, 0]
    expect(normalizeOpenSky(raw)).toBeNull()
  })
})
