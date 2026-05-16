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

export interface CelestialTimes {
  rise: string  // HH:MM
  set: string   // HH:MM
}

export interface MoonInfo {
  position: CelestialPosition
  phaseIcon: string
  times: CelestialTimes
}

export interface SunInfo {
  position: CelestialPosition
  times: CelestialTimes
}

function formatTime(date: Date | undefined): string {
  if (!date) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function moonPhaseIcon(phase: number): string {
  // phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  if (phase < 0.0625) return '🌑'
  if (phase < 0.1875) return '🌒'
  if (phase < 0.3125) return '🌓'
  if (phase < 0.4375) return '🌔'
  if (phase < 0.5625) return '🌕'
  if (phase < 0.6875) return '🌖'
  if (phase < 0.8125) return '🌗'
  if (phase < 0.9375) return '🌘'
  return '🌑'
}

export function getMoonInfo(lat: number, lon: number, date: Date): MoonInfo {
  const pos = SunCalc.getMoonPosition(date, lat, lon)
  const illum = SunCalc.getMoonIllumination(date)
  const times = SunCalc.getMoonTimes(date, lat, lon)
  return {
    position: {
      azimuth: toNorthAzimuth(pos.azimuth),
      altitude: toDegrees(pos.altitude),
    },
    phaseIcon: moonPhaseIcon(illum.phase),
    times: {
      rise: formatTime(times.rise as Date | undefined),
      set: formatTime(times.set as Date | undefined),
    },
  }
}

export function getSunInfo(lat: number, lon: number, date: Date): SunInfo {
  const pos = SunCalc.getPosition(date, lat, lon)
  const times = SunCalc.getTimes(date, lat, lon)
  return {
    position: {
      azimuth: toNorthAzimuth(pos.azimuth),
      altitude: toDegrees(pos.altitude),
    },
    times: {
      rise: formatTime(times.sunrise),
      set: formatTime(times.sunset),
    },
  }
}
