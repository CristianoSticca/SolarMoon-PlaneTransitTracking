const toDeg = (rad: number) => rad * (180 / Math.PI)

/**
 * Field of View in degrees for a given sensor dimension and focal length.
 * @param sensorMm  sensor width or height in millimetres
 * @param focalMm   focal length in millimetres
 */
export function fovDeg(sensorMm: number, focalMm: number): number {
  return 2 * toDeg(Math.atan(sensorMm / (2 * focalMm)))
}

/**
 * Angular size of an object in degrees.
 * @param sizeMeters  physical size of object (wingspan, diameter) in metres
 * @param distKm      distance to object in kilometres
 */
export function angularSizeDeg(sizeMeters: number, distKm: number): number {
  return 2 * toDeg(Math.atan(sizeMeters / (2 * distKm * 1000)))
}

/**
 * Pixel span of an angular object on a canvas.
 * @param angularDeg   angular size of object in degrees
 * @param fovHDeg      horizontal FOV of the frame in degrees
 * @param canvasW      canvas width in pixels
 */
export function pixelSpan(angularDeg: number, fovHDeg: number, canvasW: number): number {
  return canvasW * (angularDeg / fovHDeg)
}
