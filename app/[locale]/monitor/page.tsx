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
}

export default function MonitorPage() {
  const t = useTranslations('monitor')
  const tErrors = useTranslations('errors')
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const [view, setView] = useState<'radar' | 'list'>('radar')
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const { active: wakeLockActive, supported: wakeLockSupported, toggle: toggleWakeLock } = useWakeLock()

  // Load user preferences from Supabase on mount
  useEffect(() => {
    createClient()
      .from('user_preferences')
      .select('search_radius_km,angular_margin_deg,notification_lead_min')
      .single()
      .then(({ data }) => { if (data) setPrefs(data) })
  }, [])

  const geo = useGeolocation()
  const lat = geo.status === 'granted' ? geo.lat : null
  const lon = geo.status === 'granted' ? geo.lon : null

  const { data: flightData, loading, error: flightError } = useFlights({
    lat,
    lon,
    radiusKm: prefs?.search_radius_km ?? DEFAULT_RADIUS,
    enabled: geo.status === 'granted',
  })

  const transitEvents = useTransitDetection({
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
      const key = `${ev.aircraft.icao}-${ev.target}-${ev.contactTimestamp}`
      if (ev.countdown <= leadSec && !notifiedRef.current.has(key)) {
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

      {/* Flight API error */}
      {flightError && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/8 px-4 py-2 text-orange-300 text-xs font-mono break-all">
          ✈ API error: {flightError}
        </div>
      )}

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
        ) : (
          <ListView events={transitEvents} />
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
