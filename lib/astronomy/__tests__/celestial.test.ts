import { getMoonPosition, getSunPosition } from '../celestial'

describe('getMoonPosition', () => {
  it('returns azimuth in [0, 360) and altitude in [-90, 90]', () => {
    const date = new Date('2024-01-15T20:00:00Z')
    const pos = getMoonPosition(45.0, 9.0, date)
    expect(pos.azimuth).toBeGreaterThanOrEqual(0)
    expect(pos.azimuth).toBeLessThan(360)
    expect(pos.altitude).toBeGreaterThanOrEqual(-90)
    expect(pos.altitude).toBeLessThanOrEqual(90)
  })

  it('returns different positions for different times', () => {
    const date1 = new Date('2024-01-15T20:00:00Z')
    const date2 = new Date('2024-01-15T21:00:00Z')
    const pos1 = getMoonPosition(45.0, 9.0, date1)
    const pos2 = getMoonPosition(45.0, 9.0, date2)
    expect(pos1.azimuth).not.toBeCloseTo(pos2.azimuth, 0)
  })
})

describe('getSunPosition', () => {
  it('returns azimuth in [0, 360) and altitude in [-90, 90]', () => {
    const date = new Date('2024-06-21T12:00:00Z')
    const pos = getSunPosition(45.0, 9.0, date)
    expect(pos.azimuth).toBeGreaterThanOrEqual(0)
    expect(pos.azimuth).toBeLessThan(360)
    expect(pos.altitude).toBeGreaterThanOrEqual(-90)
    expect(pos.altitude).toBeLessThanOrEqual(90)
  })

  it('sun is above horizon at solar noon in summer', () => {
    // June 21 noon UTC at lat=45 lon=9 — sun should be well above horizon
    const date = new Date('2024-06-21T11:00:00Z') // ~solar noon at lon=9
    const pos = getSunPosition(45.0, 9.0, date)
    expect(pos.altitude).toBeGreaterThan(0)
  })
})
