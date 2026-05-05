'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getMoonPosition, getSunPosition } from '@/lib/astronomy/celestial'
import type { Aircraft } from '@/lib/flights/types'
import type { TransitEvent } from '@/lib/astronomy/transit'

const H_FOV = 65  // horizontal field of view (degrees) — typical mobile rear camera
const V_FOV = 50  // vertical FOV estimate for portrait mode

interface Props {
  aircraft: Aircraft[]
  transitEvents: TransitEvent[]
  lat: number
  lon: number
}

interface Orientation {
  alpha: number  // compass heading (0 = North, clockwise)
  beta: number   // tilt front-back (0 = flat, 90 = portrait vertical)
  gamma: number  // roll left-right
}

interface ScreenPos {
  x: number  // 0..1 fraction of screen width
  y: number  // 0..1 fraction of screen height
}

interface MiniPopup {
  ac: Aircraft
  isTransit: boolean
}

function acAzimuthElevation(ac: Aircraft, userLat: number, userLon: number): { az: number; el: number } {
  const distDeg = Math.sqrt((ac.lat - userLat) ** 2 + (ac.lon - userLon) ** 2)
  const distM = distDeg * 111_000
  const altM = ac.altitudeFt * 0.3048
  const el = Math.atan2(altM, Math.max(distM, 1)) * 180 / Math.PI
  const az = (Math.atan2(ac.lon - userLon, ac.lat - userLat) * 180 / Math.PI + 360) % 360
  return { az, el }
}

function project(targetAz: number, targetEl: number, orient: Orientation): ScreenPos | null {
  // Camera elevation: when beta=90 (portrait upright) → pointing at horizon (el=0)
  // when beta=0 (flat) → pointing at zenith (el=90)
  const camEl = 90 - Math.abs(orient.beta)
  const camAz = orient.alpha

  let dAz = targetAz - camAz
  while (dAz > 180) dAz -= 360
  while (dAz < -180) dAz += 360

  const dEl = targetEl - camEl

  const x = 0.5 + dAz / H_FOV
  const y = 0.5 - dEl / V_FOV

  if (x < -0.15 || x > 1.15 || y < -0.15 || y > 1.15) return null
  return { x, y }
}

export function ARView({ aircraft, transitEvents, lat, lon }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [orient, setOrient] = useState<Orientation>({ alpha: 0, beta: 90, gamma: 0 })
  const [camError, setCamError] = useState<string | null>(null)
  const [orientError, setOrientError] = useState(false)
  const [popup, setPopup] = useState<MiniPopup | null>(null)
  const [now, setNow] = useState(() => new Date())

  const transitIcaos = new Set(transitEvents.map(e => e.aircraft.icao))

  // Update time every 10s for moon/sun position
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])

  // Start camera
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })
      .catch(() => setCamError('Impossibile accedere alla fotocamera'))

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Device orientation
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.alpha == null) return
    setOrient({
      alpha: e.alpha ?? 0,
      beta: e.beta ?? 90,
      gamma: e.gamma ?? 0,
    })
  }, [])

  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setOrientError(true)
      return
    }

    // iOS 13+ requires explicit permission
    const iosRequest = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission
    if (typeof iosRequest === 'function') {
      iosRequest()
        .then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          } else {
            setOrientError(true)
          }
        })
        .catch(() => setOrientError(true))
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [handleOrientation])

  const moon = getMoonPosition(lat, lon, now)
  const sun = getSunPosition(lat, lon, now)

  const moonPos = moon.altitude > -5 ? project(moon.azimuth, moon.altitude, orient) : null
  const sunPos = sun.altitude > -5 ? project(sun.azimuth, sun.altitude, orient) : null

  // Compute screen positions for aircraft
  const acWithPos = aircraft
    .filter(ac => ac.altitudeFt > 1000)
    .map(ac => {
      const { az, el } = acAzimuthElevation(ac, lat, lon)
      const pos = project(az, el, orient)
      return { ac, pos, isTransit: transitIcaos.has(ac.icao) }
    })
    .filter(a => a.pos !== null) as { ac: Aircraft; pos: ScreenPos; isTransit: boolean }[]

  // Transit lines: connect aircraft to moon/sun
  const transitLines = acWithPos
    .filter(a => a.isTransit)
    .flatMap(a => {
      const lines = []
      const ev = transitEvents.find(e => e.aircraft.icao === a.ac.icao)
      if (!ev) return []
      if (ev.target === 'moon' && moonPos) lines.push({ from: a.pos, to: moonPos })
      if (ev.target === 'sun' && sunPos) lines.push({ from: a.pos, to: sunPos })
      return lines
    })

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={() => setPopup(null)}>
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* SVG layer for transit lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {transitLines.map((line, i) => (
          <line
            key={i}
            x1={`${line.from.x * 100}%`} y1={`${line.from.y * 100}%`}
            x2={`${line.to.x * 100}%`} y2={`${line.to.y * 100}%`}
            stroke="#4ade80" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
          />
        ))}
      </svg>

      {/* Moon */}
      {moonPos && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${moonPos.x * 100}%`, top: `${moonPos.y * 100}%` }}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute w-10 h-10 rounded-full bg-yellow-300/15 animate-pulse" />
            <svg width="26" height="26" viewBox="-13 -13 26 26">
              <path
                d="M0,-9 A9,9 0 1,1 0,9 A9,9 0 1,1 0,-9 M-4,-7 A6.5,6.5 0 1,1 -4,7 A6.5,6.5 0 1,1 -4,-7"
                fill="#ffd700" fillRule="evenodd"
              />
            </svg>
            <span className="absolute top-7 text-yellow-300 text-[10px] font-bold whitespace-nowrap drop-shadow">LUNA</span>
          </div>
        </div>
      )}

      {/* Sun */}
      {sunPos && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${sunPos.x * 100}%`, top: `${sunPos.y * 100}%` }}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute w-10 h-10 rounded-full bg-yellow-400/15 animate-pulse" />
            <svg width="28" height="28" viewBox="-14 -14 28 28">
              {[0,45,90,135,180,225,270,315].map(deg => {
                const rad = deg * Math.PI / 180
                return (
                  <line key={deg}
                    x1={Math.cos(rad)*7} y1={Math.sin(rad)*7}
                    x2={Math.cos(rad)*11} y2={Math.sin(rad)*11}
                    stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
                  />
                )
              })}
              <circle r="5.5" fill="#fbbf24" />
            </svg>
            <span className="absolute top-7 text-yellow-400 text-[10px] font-bold whitespace-nowrap drop-shadow">SOLE</span>
          </div>
        </div>
      )}

      {/* Aircraft */}
      {acWithPos.map(({ ac, pos, isTransit }) => (
        <div
          key={ac.icao}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
          onClick={e => { e.stopPropagation(); setPopup({ ac, isTransit }) }}
        >
          <div className="relative flex items-center justify-center">
            {isTransit && (
              <div className="absolute w-9 h-9 rounded-full border border-green-400/60 animate-ping" />
            )}
            <svg width="22" height="22" viewBox="-11 -11 22 22">
              <g transform={`rotate(${ac.heading})`}>
                <path
                  d="M0,-9 C1,-9 1.8,-5.5 1.8,-2 L9,3 L8.5,4.5 L1.8,2.2 L1.5,6.5 L3.5,7.5 L3,8.5 L0,8 L-3,8.5 L-3.5,7.5 L-1.5,6.5 L-1.8,2.2 L-8.5,4.5 L-9,3 L-1.8,-2 C-1.8,-5.5 -1,-9 0,-9 Z"
                  fill={isTransit ? '#4ade80' : '#facc15'}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="0.8"
                />
              </g>
            </svg>
            <span
              className={`absolute top-6 text-[9px] font-bold whitespace-nowrap drop-shadow ${isTransit ? 'text-green-400' : 'text-yellow-300'}`}
            >
              {ac.callsign || ac.icao}
            </span>
          </div>
        </div>
      ))}

      {/* Mini popup on aircraft tap */}
      {popup && (
        <div
          className="absolute z-10 rounded-xl bg-[#0f0c29]/90 border border-white/15 backdrop-blur-sm px-4 py-3 text-sm min-w-44 shadow-xl"
          style={{
            left: '50%', bottom: '120px',
            transform: 'translateX(-50%)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className={`font-bold ${popup.isTransit ? 'text-green-400' : 'text-white'}`}>
            ✈ {popup.ac.callsign || popup.ac.icao}
          </div>
          <div className="text-white/50 text-xs mt-1">
            {popup.ac.altitudeFt.toLocaleString()} ft · {popup.ac.speedKnots} kt
          </div>
          {popup.isTransit && (
            <div className="mt-1.5 text-xs text-green-400 bg-green-400/10 rounded-lg px-2 py-1">
              ⚡ In transito
            </div>
          )}
          <button
            onClick={() => setPopup(null)}
            className="absolute top-2 right-2 text-white/30 hover:text-white text-base leading-none"
          >✕</button>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm drop-shadow">📷 AR</span>
          {orientError && (
            <span className="text-yellow-400 text-xs bg-black/40 rounded-full px-2 py-0.5">
              Bussola non disponibile
            </span>
          )}
        </div>
        <div className="text-white/40 text-xs bg-black/30 rounded-full px-2 py-1">
          {acWithPos.length} aerei in vista · {transitLines.length > 0 ? `${transitLines.length} transiti` : 'nessun transito'}
        </div>
      </div>

      {/* Camera error */}
      {camError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#0f0c29]/90 rounded-2xl px-6 py-5 text-center max-w-xs">
            <div className="text-3xl mb-3">📷</div>
            <div className="text-white font-semibold text-sm">{camError}</div>
            <div className="text-white/40 text-xs mt-2">
              Consenti l'accesso alla fotocamera nelle impostazioni del browser
            </div>
          </div>
        </div>
      )}

      {/* Crosshair center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-6 h-6 relative opacity-30">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white -translate-y-1/2" />
        </div>
      </div>
    </div>
  )
}
