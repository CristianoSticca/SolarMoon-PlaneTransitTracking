import SunCalc from 'suncalc'

export interface CelestialPosition {
  azimuth: number   // degrees from north, [0, 360)
  altitude: number  // degrees above horizon, [-90, 90]
}

// SunCalc returns azimuth measured from south, clockwise. Convert to north-clockwise.
function toNorthAzimuth(suncalcAzimuth: number): number {
  return ((suncalcAzimuth * 180 / Math.PI) + 180) % 360
}

function toDegrees(rad: number): number {
  return rad * 180 / Math.PI
}

export function getMoonPosition(lat: number, lon: number, date: Date): CelestialPosition {
  const pos = SunCalc.getMoonPosition(date, lat, lon)
  return {
    azimuth: toNorthAzimuth(pos.azimuth),
    altitude: toDegrees(pos.altitude),
  }
}

export function getSunPosition(lat: number, lon: number, date: Date): CelestialPosition {
  const pos = SunCalc.getPosition(date, lat, lon)
  return {
    azimuth: toNorthAzimuth(pos.azimuth),
    altitude: toDegrees(pos.altitude),
  }
}
