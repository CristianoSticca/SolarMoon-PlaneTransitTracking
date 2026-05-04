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
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] rounded-t-2xl border-t border-white/10 bg-[#0f0c29]/95 backdrop-blur-md p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isTransit ? 'text-green-400' : 'text-white'}`}>
            ✈ {ac.callsign || ac.icao}
          </span>
          {isTransit && <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">TRANSITO</span>}
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <div className="text-white/40 text-xs">ICAO</div>
          <div className="font-mono text-white/80">{ac.icao}</div>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <div className="text-white/40 text-xs">Altitudine</div>
          <div className="font-mono text-white/80">{ac.altitudeFt.toLocaleString()} ft</div>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <div className="text-white/40 text-xs">Velocità</div>
          <div className="font-mono text-white/80">{ac.speedKnots} kt</div>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <div className="text-white/40 text-xs">Heading</div>
          <div className="font-mono text-white/80">{ac.heading}°</div>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2 col-span-2">
          <div className="text-white/40 text-xs">Posizione</div>
          <div className="font-mono text-white/80">{ac.lat.toFixed(4)}°, {ac.lon.toFixed(4)}°</div>
        </div>
      </div>
    </div>
  )
}

export function MapView({ aircraft, transitEvents, lat, lon }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<import('leaflet').Marker[]>([])
  const [selected, setSelected] = useState<SelectedAircraft | null>(null)

  const transitIcaos = new Set(transitEvents.map(e => e.aircraft.icao))

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, {
        center: [lat, lon],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)

      // Observer marker
      L.circleMarker([lat, lon], {
        radius: 6,
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
    }
  }, [lat, lon])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    import('leaflet').then(L => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      aircraft.forEach(ac => {
        if (ac.altitudeFt < 1000) return
        const isTransit = transitIcaos.has(ac.icao)
        const color = isTransit ? '#4ade80' : '#94a3b8'

        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-12 -12 24 24">
          <g transform="rotate(${ac.heading})">
            <path d="M0,-7 L1.5,-2 L5,0 L1.5,1 L1,5 L0,4 L-1,5 L-1.5,1 L-5,0 L-1.5,-2 Z"
              fill="${color}" stroke="${isTransit ? '#fff' : 'none'}" stroke-width="${isTransit ? 0.5 : 0}"/>
          </g>
        </svg>`

        const icon = L.divIcon({
          html: svgIcon,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([ac.lat, ac.lon], { icon })
          .on('click', () => setSelected({ ac, isTransit }))
          .addTo(map)

        markersRef.current.push(marker)
      })
    })
  }, [aircraft, transitEvents])

  return (
    <div className="relative flex-1 rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      {selected && (
        <AircraftPanel selected={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
