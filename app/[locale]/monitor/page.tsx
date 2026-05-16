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
import { createClient } from '@/lib/supabase/client'
import { AppHeader } from '@/components/layout/AppHeader'

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
  const [mounted, setMounted] = useState(false)
  const { active: wakeLockActive, supported: wakeLockSupported, toggle: toggleWakeLock } = useWakeLock()

  useEffect(() => { setMounted(true) }, [])

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
    <div className="flex flex-col" style={{ color: '#e8eaf0' }}>
      <AppHeader
        pageLabel="Monitor"
        right={
          geo.status === 'granted'
            ? <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8892a4', letterSpacing: '0.04em' }}>{geo.lat.toFixed(4)}° N · {geo.lon.toFixed(4)}° E</span>
            : undefined
        }
      />

      {/* Status bar */}
      <div className="px-4 pb-2 flex justify-between items-center" style={{ position: 'relative', zIndex: 1, fontSize: 9, color: '#8892a4', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
        <span>
          <span style={{ display: 'inline-block', width: 5, height: 5, background: flightData ? '#4ade80' : '#8892a4', borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' }} />
          {flightData ? `ADS-B · ${flightData.aircraft?.length ?? 0} contacts` : 'ADS-B · connecting…'}
        </span>
        <span className="flex items-center gap-3">
          {mounted && wakeLockSupported && (
            <button
              onClick={toggleWakeLock}
              title={wakeLockActive ? 'Screen lock on' : 'Screen lock off'}
              style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, border: `1px solid ${wakeLockActive ? 'rgba(232,200,72,0.4)' : 'rgba(136,146,164,0.3)'}`, background: wakeLockActive ? 'rgba(232,200,72,0.1)' : 'transparent', color: wakeLockActive ? '#e8c848' : '#8892a4', letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              {wakeLockActive ? '◉ AWAKE' : '◎ SLEEP'}
            </button>
          )}
          <button onClick={handleLogout} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(136,146,164,0.3)', background: 'transparent', color: '#8892a4', letterSpacing: '0.06em', cursor: 'pointer' }}>
            SIGN OUT
          </button>
        </span>
      </div>

      {/* View tabs */}
      <div className="px-4 pb-3" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['radar', 'list', 'map', 'ar'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
              style={
                view === v
                  ? { background: 'rgba(232,200,72,0.12)', color: '#e8c848', border: '1px solid rgba(232,200,72,0.25)', letterSpacing: '0.05em', textTransform: 'uppercase' }
                  : { color: '#8892a4', border: '1px solid transparent', letterSpacing: '0.05em', textTransform: 'uppercase' }
              }
            >
              {v === 'radar' ? t('radar') : v === 'list' ? t('list') : v === 'map' ? t('map') : t('ar')}
            </button>
          ))}
        </div>
      </div>

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

    </div>
  )
}
