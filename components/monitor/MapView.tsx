'use client'

import { useEffect, useRef, useState } from 'react'
import type { Aircraft } from '@/lib/flights/types'
import type { TransitEvent } from '@/lib/astronomy/transit'

interface Props {
  aircraft: Aircraft[]
  transitEvents: TransitEvent[]
  lat: number
  lon: number
}

interface SelectedAircraft {
  ac: Aircraft
  isTransit: boolean
}

function AircraftPanel({ selected, onClose }: { selected: SelectedAircraft; onClose: () => void }) {
  const { ac, isTransit } = selected

  const rows = [
    { label: 'Volo', value: ac.callsign || '—' },
    { label: 'ICAO', value: ac.icao },
    ac.registration ? { label: 'Registrazione', value: ac.registration } : null,
    ac.aircraftType ? { label: 'Tipo aereo', value: ac.aircraftType } : null,
    { label: 'Altitudine', value: `${ac.altitudeFt.toLocaleString()} ft` },
    { label: 'Velocità', value: `${ac.speedKnots} kt` },
    { label: 'Heading', value: `${ac.heading}°` },
    ac.verticalRateFpm != null ? {
      label: 'Vario',
      value: ac.verticalRateFpm > 64 ? `▲ ${ac.verticalRateFpm} fpm` :
             ac.verticalRateFpm < -64 ? `▼ ${Math.abs(ac.verticalRateFpm)} fpm` : '→ livello',
    } : null,
    ac.squawk ? { label: 'Squawk', value: ac.squawk } : null,
    { label: 'Posizione', value: `${ac.lat.toFixed(4)}°, ${ac.lon.toFixed(4)}°` },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] rounded-t-2xl border-t border-white/10 bg-[#0f0c29]/95 backdrop-blur-md p-5 space-y-3 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-lg font-bold ${isTransit ? 'text-green-400' : 'text-white'}`}>
            ✈ {ac.callsign || ac.icao}
          </span>
          {ac.aircraftType && <span className="text-xs text-white/40 font-mono">{ac.aircraftType}</span>}
          {isTransit && <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">TRANSITO</span>}
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none shrink-0">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className={`rounded-lg bg-white/5 px-3 py-2 ${label === 'Posizione' ? 'col-span-2' : ''}`}>
            <div className="text-white/40 text-xs">{label}</div>
            <div className="font-mono text-white/80 text-sm">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MapView({ aircraft, transitEvents, lat, lon }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<import('leaflet').Marker[]>([])
  const observerRef = useRef<import('leaflet').CircleMarker | null>(null)
  const initializedRef = useRef(false)
  const [selected, setSelected] = useState<SelectedAircraft | null>(null)
  const setSelectedRef = useRef(setSelected)
  setSelectedRef.current = setSelected

  const transitIcaos = new Set(transitEvents.map(e => e.aircraft.icao))

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return
    initializedRef.current = true

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 9,
        zoomControl: false,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)

      observerRef.current = L.circleMarker([lat, lon], {
        radius: 7,
        fillColor: '#a78bfa',
        fillOpacity: 1,
        color: '#fff',
        weight: 2,
      }).addTo(map)

      mapInstanceRef.current = map
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      initializedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — initialize once only

  // Update markers only (no map re-init)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      aircraft.forEach(ac => {
        if (ac.altitudeFt < 1000) return
        const isTransit = transitIcaos.has(ac.icao)
        const color = isTransit ? '#4ade80' : '#94a3b8'

        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="-16 -16 32 32">
          <g transform="rotate(${ac.heading})">
            <path d="M0,-10 L2,-3 L8,0 L2,2 L1.5,8 L0,6 L-1.5,8 L-2,2 L-8,0 L-2,-3 Z"
              fill="${color}" stroke="${isTransit ? '#fff' : 'rgba(0,0,0,0.4)'}" stroke-width="1"/>
            ${isTransit ? `<circle cx="0" cy="0" r="13" fill="none" stroke="#4ade80" stroke-width="1.5" opacity="0.5"/>` : ''}
          </g>
        </svg>`

        const icon = L.divIcon({
          html: svgIcon,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([ac.lat, ac.lon], { icon })
          .on('click', () => setSelectedRef.current({ ac, isTransit }))
          .addTo(map)

        markersRef.current.push(marker)
      })
    })
  }, [aircraft, transitEvents])

  return (
    <div className="relative flex-1 rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
      <div ref={mapRef} className="absolute inset-0" />
      {selected && (
        <AircraftPanel selected={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

