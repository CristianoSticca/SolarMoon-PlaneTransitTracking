'use client'

import { useMemo, useEffect, useState } from 'react'
import { getMoonPosition, getSunPosition } from '@/lib/astronomy/celestial'
import type { TransitEvent } from '@/lib/astronomy/transit'
import type { Aircraft } from '@/lib/flights/types'

const SIZE = 300
const CX = SIZE / 2
const CY = SIZE / 2
const MAX_R = 130

function azElToXY(azimuth: number, elevation: number): { x: number; y: number } {
  const r = MAX_R * (1 - Math.max(0, elevation) / 90)
  const azRad = (azimuth - 90) * Math.PI / 180
  return {
    x: CX + r * Math.cos(azRad),
    y: CY + r * Math.sin(azRad),
  }
}

interface Props {
  aircraft: Aircraft[]
  transitEvents: TransitEvent[]
  lat: number
  lon: number
}

export function RadarView({ aircraft, transitEvents, lat, lon }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const moon = useMemo(() => getMoonPosition(lat, lon, now), [lat, lon, now])
  const sun = useMemo(() => getSunPosition(lat, lon, now), [lat, lon, now])
  const transitIcaos = useMemo(
    () => new Set(transitEvents.map(e => e.aircraft.icao)),
    [transitEvents]
  )

  const moonXY = moon.altitude > -5 ? azElToXY(moon.azimuth, moon.altitude) : null
  const sunXY = sun.altitude > -5 ? azElToXY(sun.azimuth, sun.altitude) : null

  // When below horizon, show on the outer ring edge to indicate direction
  const moonEdgeXY = !moonXY ? azElToXY(moon.azimuth, -89) : null
  const sunEdgeXY = !sunXY ? azElToXY(sun.azimuth, -89) : null

  return (
    <div className="flex flex-1 items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <radialGradient id="moonGrad">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#ffa000" />
          </radialGradient>
          <radialGradient id="sunGrad">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fbbf24" />
          </radialGradient>
        </defs>

        {/* Rings */}
        {[MAX_R, MAX_R * 0.66, MAX_R * 0.33].map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
        ))}

        {/* Cross lines */}
        <line x1={CX - MAX_R} y1={CY} x2={CX + MAX_R} y2={CY} stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
        <line x1={CX} y1={CY - MAX_R} x2={CX} y2={CY + MAX_R} stroke="rgba(139,92,246,0.15)" strokeWidth="1" />

        {/* Cardinal labels */}
        {([['N', CX, CY - MAX_R - 12], ['S', CX, CY + MAX_R + 16], ['E', CX + MAX_R + 12, CY + 4], ['W', CX - MAX_R - 12, CY + 4]] as const).map(([label, x, y]) => (
          <text key={label} x={x} y={y} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">{label}</text>
        ))}

        {/* Moon — crescent shape via evenodd compound path */}
        {moonXY && (
          <g>
            <circle cx={moonXY.x} cy={moonXY.y} r={16} fill="rgba(255,215,0,0.10)" />
            <path
              transform={`translate(${moonXY.x},${moonXY.y})`}
              d="M0,-7 A7,7 0 1,1 0,7 A7,7 0 1,1 0,-7 M-3,-5 A5,5 0 1,1 -3,5 A5,5 0 1,1 -3,-5"
              fill="#ffd700"
              fillRule="evenodd"
            />
          </g>
        )}
        {moonEdgeXY && (
          <g opacity="0.3">
            <path
              transform={`translate(${moonEdgeXY.x},${moonEdgeXY.y})`}
              d="M0,-7 A7,7 0 1,1 0,7 A7,7 0 1,1 0,-7 M-3,-5 A5,5 0 1,1 -3,5 A5,5 0 1,1 -3,-5"
              fill="#ffd700"
              fillRule="evenodd"
            />
            <text x={moonEdgeXY.x} y={moonEdgeXY.y + 16} textAnchor="middle" fill="#ffd700" fontSize="7" fontFamily="monospace">▼</text>
          </g>
        )}

        {/* Sun — circle + 8 rays */}
        {sunXY && (
          <g transform={`translate(${sunXY.x},${sunXY.y})`}>
            <circle r={18} fill="rgba(251,191,36,0.08)" />
            {[0,45,90,135,180,225,270,315].map(deg => {
              const rad = deg * Math.PI / 180
              return (
                <line key={deg}
                  x1={Math.cos(rad)*8.5} y1={Math.sin(rad)*8.5}
                  x2={Math.cos(rad)*12} y2={Math.sin(rad)*12}
                  stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"
                />
              )
            })}
            <circle r={6} fill="url(#sunGrad)" />
          </g>
        )}
        {sunEdgeXY && (
          <g opacity="0.3" transform={`translate(${sunEdgeXY.x},${sunEdgeXY.y})`}>
            {[0,45,90,135,180,225,270,315].map(deg => {
              const rad = deg * Math.PI / 180
              return (
                <line key={deg}
                  x1={Math.cos(rad)*8.5} y1={Math.sin(rad)*8.5}
                  x2={Math.cos(rad)*12} y2={Math.sin(rad)*12}
                  stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"
                />
              )
            })}
            <circle r={6} fill="url(#sunGrad)" />
            <text x={0} y={20} textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace">▼</text>
          </g>
        )}

        {/* Aircraft */}
        {aircraft.slice(0, 40).map(ac => {
          if (ac.altitudeFt < 1000) return null
          const distDeg = Math.sqrt((ac.lat - lat) ** 2 + (ac.lon - lon) ** 2)
          const distM = distDeg * 111000
          const altM = ac.altitudeFt * 0.3048
          const elDeg = Math.atan2(altM, Math.max(distM, 1)) * 180 / Math.PI
          const az = (Math.atan2(ac.lon - lon, ac.lat - lat) * 180 / Math.PI + 360) % 360
          const { x, y } = azElToXY(az, elDeg)
          const isTransit = transitIcaos.has(ac.icao)
          const color = isTransit ? '#4ade80' : '#94a3b8'
          return (
            <g key={ac.icao} transform={`translate(${x},${y}) rotate(${ac.heading})`}>
              {isTransit && <circle cx={0} cy={0} r={13} fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.5" />}
              {/* FR24-style airplane silhouette: fuselage + swept wings + tail fins */}
              <path
                d="M0,-8 C0.9,-8 1.5,-5 1.5,-2 L8,2.5 L7.5,4 L1.5,2 L1.2,5.5 L3,6.5 L2.8,7.5 L0,7 L-2.8,7.5 L-3,6.5 L-1.2,5.5 L-1.5,2 L-7.5,4 L-8,2.5 L-1.5,-2 C-1.5,-5 -0.9,-8 0,-8 Z"
                fill={color}
                opacity={isTransit ? 1 : 0.7}
              />
            </g>
          )
        })}

        {/* Observer center dot */}
        <circle cx={CX} cy={CY} r={4} fill="white" opacity="0.9" />
      </svg>
    </div>
  )
}
