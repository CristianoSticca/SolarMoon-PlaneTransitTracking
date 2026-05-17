export type Target = 'moon' | 'sun'

export type CameraId = 'ff' | 'apsc_c' | 'apsc_s' | 'm43'

export type Camera = {
  id: CameraId
  name: string
  sensorW: number   // mm
  sensorH: number   // mm
  cropFactor: number
}

export type Aircraft = {
  id: string
  name: string
  wingspan: number  // meters
  length: number    // meters
}

export type SimulatorState = {
  target: Target
  cameraId: CameraId
  focalMm: number
  aircraftId: string
}
