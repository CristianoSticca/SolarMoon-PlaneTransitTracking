'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useFlights } from '@/hooks/useFlights'
import { useTransitDetection } from '@/hooks/useTransitDetection'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useSessionLog } from '@/hooks/useSessionLog'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { RadarView } from '@/components/monitor/RadarView'
import { ListView } from '@/components/monitor/ListView'
import dynamic from 'next/dynamic'
const MapView = dynamic(() => import('@/components/monitor/MapView').then(m => m.MapView), { ssr: false })
const ARView = dynamic(() => import('@/components/monitor/ARView').then(m => m.ARView), { ssr: false })
import { TransitAlert } from '@/components/monitor/TransitAlert'
import { MonitorToggle } from '@/components/monitor/MonitorToggle'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const DEFAULT_MARGIN = 0.5
const DEFAULT_RADIUS = 25

interface UserPrefs {
  search_radius_km: number
  angular_margin_deg: number
  notification_lead_min: number
  background_push_enabled: boolean
}

export default function MonitorPage() {
  const t = useTranslations('monitor')
  const tErrors = useTranslations('errors')
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const [view, setView] = useState<'radar' | 'list' | 'map' | 'ar'>('radar')
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const { active: wakeLockActive, supported: wakeLockSupported, toggle: toggleWakeLock } = useWakeLock()

  // Load user preferences from Supabase on mount
  useEffect(() => {
    createClient()
      .from('user_preferences')
      .select('search_radius_km,angular_margin_deg,notification_lead_min,background_push_enabled')
      .single()
      .then(({ data }) => { if (data) setPrefs(data) })
  }, [])

  const geo = useGeolocation()
  const lat = geo.status === 'granted' ? geo.lat : null
  const lon = geo.status === 'granted' ? geo.lon : null

  // Save GPS position to Supabase every 5 min for background push cron
  const latRef = useRef(lat)
  const lonRef = useRef(lon)
  latRef.current = lat
  lonRef.current = lon
  useEffect(() => {
    if (geo.status !== 'granted') return
    function savePos() {
      const currentLat = latRef.current
      const currentLon = lonRef.current
      if (currentLat == null || currentLon == null) return
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return
        supabase.from('user_preferences')
          .update({
            last_lat: currentLat,
            last_lon: currentLon,
            last_seen_at: new Date().toISOString(),
          })
          .eq('user_id', data.user.id)
          .then(({ error }) => { if (error) console.error('GPS save error:', error.message) })
      })
    }
    savePos() // immediate when GPS first becomes granted
    const interval = setInterval(savePos, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [geo.status]) // re-runs when GPS status changes

  const { data: flightData, loading } = useFlights({
    lat,
    lon,
    radiusKm: prefs?.search_radius_km ?? DEFAULT_RADIUS,
    enabled: geo.status === 'granted',
  })

  const { events: transitEvents, nearby: nearbyAircraft } = useTransitDetection({
    aircraft: flightData?.aircraft ?? [],
    lat: lat ?? 0,
    lon: lon ?? 0,
    marginDeg: prefs?.angular_margin_deg ?? DEFAULT_MARGIN,
  })

  // Session log — persists detected transits in sessionStorage
  useSessionLog(transitEvents)

  // Push notification when transit is within lead time
  const { notify } = usePushNotifications()
  const notifiedRef = useRef(new Set<string>())

  useEffect(() => {
    if (!transitEvents.length) return
    const leadSec = (prefs?.notification_lead_min ?? 3) * 60
    for (const ev of transitEvents) {
      const key = `${ev.aircraft.icao}-${ev.target}`
      if (ev.countdown <= leadSec && !notifiedRef.current.has(key)) {
        if (!('Notification' in window) || Notification.permission !== 'granted') continue
        notifiedRef.current.add(key)
        const targetLabel = ev.target === 'moon' ? '🌙 Luna' : '☀️ Sole'
        notify(
          `✈ ${ev.aircraft.callsign || ev.aircraft.icao} → ${targetLabel}`,
          `Transito tra ${Math.ceil(ev.countdown / 60)} min · Scarto ±${ev.minAngularSeparation.toFixed(2)}°`
        )
      }
    }
  }, [transitEvents, notify, prefs])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push(`/${locale}/login`)
  }

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">🌙 SolarMoon</span>
        <div className="flex items-center gap-3">
          {flightData && (
            <span className="text-green-400 text-xs font-mono">⬤ {t('live')}</span>
          )}
          {loading && <span className="text-white/30 text-xs animate-pulse">...</span>}
          <Link href={`/${locale}/settings`} className="text-white/50 hover:text-white transition-colors text-xl" aria-label="Settings">⚙</Link>
          <Link href={`/${locale}/guide`} className="text-white/50 hover:text-white transition-colors text-lg font-bold" aria-label="Guide">?</Link>
        </div>
      </div>

      {/* Toggle */}
      <MonitorToggle view={view} onChange={setView} />

      {/* GPS error */}
      {geo.status === 'denied' && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/8 px-4 py-3 text-red-400 text-sm">
          {tErrors('gpsRequired')}
        </div>
      )}

      {/* Main view */}
      {geo.status === 'granted' && lat !== null && lon !== null && (
        view === 'radar' ? (
          <RadarView
            aircraft={flightData?.aircraft ?? []}
            transitEvents={transitEvents}
            lat={lat}
            lon={lon}
          />
        ) : view === 'list' ? (
          <ListView events={transitEvents} nearby={nearbyAircraft} />
        ) : view === 'map' ? (
          <MapView
            aircraft={flightData?.aircraft ?? []}
            transitEvents={transitEvents}
            lat={lat}
            lon={lon}
          />
        ) : (
          <ARView
            aircraft={flightData?.aircraft ?? []}
            transitEvents={transitEvents}
            lat={lat}
            lon={lon}
            onClose={() => setView('radar')}
          />
        )
      )}

      {/* GPS requesting */}
      {(geo.status === 'idle' || geo.status === 'requesting') && (
        <div className="flex flex-1 items-center justify-center text-white/40 text-sm">
          {t('searching')}
        </div>
      )}

      {/* Transit alert — always fixed at bottom */}
      {geo.status === 'granted' && (
        <TransitAlert event={transitEvents[0] ?? null} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-white/20 text-xs pb-safe">
        <span>
          {flightData ? t('aircraft', { count: flightData.aircraft.length }) : ''}
        </span>
        <div className="flex gap-3 items-center">
          {wakeLockSupported && (
            <button
              onClick={toggleWakeLock}
              className={`transition-colors ${wakeLockActive ? 'text-violet-400' : 'hover:text-white/40'}`}
            >
              {t('wakeLock')}
            </button>
          )}
          <button onClick={handleLogout} className="hover:text-white/50 transition-colors">
            logout
          </button>
        </div>
      </div>
    </div>
  )
}
