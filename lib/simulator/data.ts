import type { Camera, Aircraft } from './types'

export const CAMERAS: Camera[] = [
  { id: 'ff',     name: 'Full Frame',       sensorW: 36.0, sensorH: 24.0, cropFactor: 1.0 },
  { id: 'apsc_c', name: 'APS-C Canon',      sensorW: 22.3, sensorH: 14.9, cropFactor: 1.6 },
  { id: 'apsc_s', name: 'APS-C Sony/Nikon', sensorW: 23.5, sensorH: 15.6, cropFactor: 1.5 },
  { id: 'm43',    name: 'Micro 4/3',        sensorW: 17.3, sensorH: 13.0, cropFactor: 2.0 },
]

export const AIRCRAFT: Aircraft[] = [
  { id: 'b737', name: 'Boeing 737-800',        wingspan: 35.8,  length: 39.5 },
  { id: 'a320', name: 'Airbus A320',           wingspan: 35.8,  length: 37.6 },
  { id: 'b787', name: 'Boeing 787 Dreamliner', wingspan: 60.1,  length: 57.0 },
  { id: 'a380', name: 'Airbus A380',           wingspan: 79.75, length: 73.0 },
  { id: 'crj2', name: 'CRJ-200 Regional',      wingspan: 21.0,  length: 26.0 },
]
