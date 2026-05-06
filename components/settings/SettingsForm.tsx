'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface Prefs {
  language: string
  search_radius_km: number
  angular_margin_deg: number
  notification_lead_min: number
  background_push_enabled: boolean
}

export function SettingsForm({
  initialPrefs,
  userId,
  locale,
}: {
  initialPrefs: Prefs
  userId: string
  locale: string
}) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [prefs, setPrefs] = useState(initialPrefs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const { state: pushState, request: requestPush } = usePushNotifications()

  type ProviderStatus = 'ok' | 'error' | 'unconfigured'
  interface ProviderResult { name: string; status: ProviderStatus; ms: number }
  const [healthResults, setHealthResults] = useState<ProviderResult[] | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null)
  const [pushTestStatus, setPushTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function sendTestPush() {
    setPushTestStatus('sending')
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      setPushTestStatus(res.ok ? 'ok' : 'error')
    } catch {
      setPushTestStatus('error')
    } finally {
      setTimeout(() => setPushTestStatus('idle'), 3000)
    }
  }

  async function runHealthCheck() {
    setHealthLoading(true)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealthResults(data.providers)
      setHealthCheckedAt(data.checkedAt)
    } catch {
      setHealthResults([])
    } finally {
      setHealthLoading(false)
    }
  }

  useEffect(() => {
    if (!navigator.permissions) {
      // iOS Safari doesn't support permissions.query — probe directly
      navigator.geolocation.getCurrentPosition(
        () => setGpsStatus('granted'),
        (err) => setGpsStatus(err.code === 1 ? 'denied' : 'prompt'),
        { timeout: 100, maximumAge: Infinity }
      )
      return
    }
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      setGpsStatus(result.state as 'granted' | 'denied' | 'prompt')
      result.onchange = () => setGpsStatus(result.state as 'granted' | 'denied' | 'prompt')
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('user_preferences').upsert({ user_id: userId, ...prefs })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (prefs.language !== locale) {
      window.location.replace(`/${prefs.language}/settings`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Language */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/70">{t('language')}</span>
        <div className="flex gap-2">
          {['it', 'en'].map(l => (
            <button
              key={l}
              onClick={() => setPrefs(p => ({ ...p, language: l }))}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                prefs.language === l
                  ? 'bg-violet-600 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search radius */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
        <div className="flex justify-between mb-3">
          <span className="text-sm text-white/70">{t('radius')}</span>
          <span className="text-sm font-mono text-violet-400">
            {prefs.search_radius_km} {t('radiusUnit')}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={5}
          value={prefs.search_radius_km}
          onChange={e => setPrefs(p => ({ ...p, search_radius_km: Number(e.target.value) }))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-white/20 text-xs mt-1">
          <span>10</span><span>50</span>
        </div>
      </div>

      {/* Angular margin */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
        <div className="flex justify-between mb-3">
          <span className="text-sm text-white/70">{t('margin')}</span>
          <span className="text-sm font-mono text-violet-400">±{prefs.angular_margin_deg}°</span>
        </div>
        <div className="flex gap-2">
          {[0.2, 0.5, 1.5].map(v => (
            <button
              key={v}
              onClick={() => setPrefs(p => ({ ...p, angular_margin_deg: v }))}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                prefs.angular_margin_deg === v
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/8 text-white/50 hover:bg-white/12'
              }`}
            >
              ±{v}°
            </button>
          ))}
        </div>
      </div>

      {/* Notification lead time */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/70">{t('leadTime')}</span>
        <div className="flex gap-2">
          {[3, 5].map(v => (
            <button
              key={v}
              onClick={() => setPrefs(p => ({ ...p, notification_lead_min: v }))}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                prefs.notification_lead_min === v
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/8 text-white/50 hover:bg-white/12'
              }`}
            >
              {v} {t('leadUnit')}
            </button>
          ))}
        </div>
      </div>

      {/* Provider info (read-only) */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/70">{t('provider')}</span>
        <span className="text-green-400 text-xs">{t('providerAuto')}</span>
      </div>

      {/* GPS permission */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/70">{t('gpsTitle')}</p>
          <p className="text-xs mt-0.5 text-white/40">
            {gpsStatus === 'granted' && <span className="text-green-400">{t('gpsGranted')}</span>}
            {gpsStatus === 'denied' && <span className="text-red-400">{t('gpsDenied')}</span>}
            {(gpsStatus === 'prompt' || gpsStatus === 'unknown') && t('gpsPrompt')}
          </p>
        </div>
        {gpsStatus === 'prompt' && (
          <button
            onClick={() => navigator.geolocation.getCurrentPosition(() => setGpsStatus('granted'), () => setGpsStatus('denied'))}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 text-xs font-semibold hover:bg-violet-500 transition-colors"
          >
            {t('gpsRequest')}
          </button>
        )}
      </div>

      {/* Push notifications */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/70">{t('notifTitle')}</p>
          <p className="text-xs mt-0.5 text-white/40">
            {pushState === 'granted' && <span className="text-green-400">{t('notifGranted')}</span>}
            {pushState === 'denied' && <span className="text-red-400">{t('notifDenied')}</span>}
            {(pushState === 'idle' || pushState === 'unsupported') && t('notifPrompt')}
          </p>
        </div>
        {pushState === 'idle' && (
          <button
            onClick={requestPush}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 text-xs font-semibold hover:bg-violet-500 transition-colors"
          >
            {t('notifRequest')}
          </button>
        )}
        {pushState === 'unsupported' && (
          <span className="text-xs text-white/30 text-right">iOS 16.4+{"\n"}+ home screen</span>
        )}
      </div>

      {/* Background push notifications toggle */}
      {pushState === 'granted' && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">{t('bgPushTitle')}</p>
            <p className="text-xs mt-0.5 text-white/40">{t('bgPushDesc')}</p>
            <button
              onClick={sendTestPush}
              disabled={pushTestStatus === 'sending'}
              className="mt-1.5 text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
            >
              {pushTestStatus === 'sending' && '...'}
              {pushTestStatus === 'ok' && '✓ Inviata!'}
              {pushTestStatus === 'error' && '✗ Errore'}
              {pushTestStatus === 'idle' && 'Invia notifica di test'}
            </button>
          </div>
          <button
            onClick={() => setPrefs(p => ({ ...p, background_push_enabled: !p.background_push_enabled }))}
            className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${
              prefs.background_push_enabled ? 'bg-violet-600' : 'bg-white/15'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              prefs.background_push_enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      )}

      {/* Health check */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{t('healthTitle')}</span>
          <button
            onClick={runHealthCheck}
            disabled={healthLoading}
            className="px-3 py-1.5 rounded-lg bg-violet-600/80 text-xs font-semibold hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {healthLoading ? '...' : t('healthRun')}
          </button>
        </div>
        {healthResults && (
          <div className="space-y-1.5">
            {healthResults.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    p.status === 'ok' ? 'bg-green-400' :
                    p.status === 'unconfigured' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-white/60 font-mono">{p.name}</span>
                </div>
                <span className="text-white/30 font-mono">
                  {p.status === 'ok' ? `${p.ms}ms` :
                   p.status === 'unconfigured' ? t('healthUnconfigured') :
                   t('healthError')}
                </span>
              </div>
            ))}
            {healthCheckedAt && (
              <p className="text-white/20 text-xs pt-1">
                {new Date(healthCheckedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 transition-colors"
      >
        {saved ? `✓ ${t('saved')}` : saving ? '...' : t('save')}
      </button>
    </div>
  )
}
