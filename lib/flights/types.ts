export interface Aircraft {
  icao: string
  callsign: string
  lat: number
  lon: number
  altitudeFt: number
  heading: number      // degrees from north
  speedKnots: number
  registration?: string
  aircraftType?: string
  squawk?: string
  verticalRateFpm?: number
}

export interface FlightApiResponse {
  aircraft: Aircraft[]
  provider: 'adsb-one' | 'airplanes-live' | 'opensky'
  timestamp: number
}
