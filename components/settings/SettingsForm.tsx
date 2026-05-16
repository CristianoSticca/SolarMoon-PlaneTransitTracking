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

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: '12px 16px',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#e8eaf0',
}

const mutedStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#8892a4',
}

const goldValueStyle: React.CSSProperties = {
  color: '#e8c848',
  fontFamily: 'monospace',
  fontSize: 13,
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
  const [mounted, setMounted] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const { state: pushState, subscribed: pushSubscribed, request: requestPush, resubscribe: resubscribePush } = usePushNotifications()

  type ProviderStatus = 'ok' | 'error' | 'unconfigured'
  interface ProviderResult { name: string; status: ProviderStatus; ms: number }
  const [healthResults, setHealthResults] = useState<ProviderResult[] | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null)
  const [pushTestStatus, setPushTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [registraStatus, setRegistraStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [registraError, setRegistraError] = useState<string | null>(null)

  async function handleRegistra() {
    setRegistraStatus('sending')
    setRegistraError(null)
    try {
      if (!('serviceWorker' in navigator)) throw new Error('Service worker non supportato')
      if (!('PushManager' in window)) throw new Error('PushManager non supportato')
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout service worker (10s)')), 10000))
      ])
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await Promise.race([
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout subscribe (10s)')), 10000))
        ])
      }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      setRegistraError(null)
      setRegistraStatus('ok')
    } catch (e) {
      setRegistraStatus('error')
      setRegistraError(String(e))
    }
  }

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

  useEffect(() => { setMounted(true) }, [])

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
    <div className="space-y-3">
      {/* Language */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={labelStyle}>{t('language')}</span>
        <div className="flex gap-2">
          {['it', 'en'].map(l => (
            <button
              key={l}
              onClick={() => setPrefs(p => ({ ...p, language: l }))}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: prefs.language === l ? 'rgba(232,200,72,0.2)' : 'transparent',
                border: prefs.language === l ? '1px solid #e8c848' : '1px solid transparent',
                color: prefs.language === l ? '#e8c848' : '#8892a4',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search radius */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={labelStyle}>{t('radius')}</span>
          <span style={goldValueStyle}>{prefs.search_radius_km} {t('radiusUnit')}</span>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={5}
          value={prefs.search_radius_km}
          onChange={e => setPrefs(p => ({ ...p, search_radius_km: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: '#e8c848' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', ...mutedStyle, marginTop: 4 }}>
          <span>10</span><span>50</span>
        </div>
      </div>

      {/* Angular margin */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={labelStyle}>{t('margin')}</span>
          <span style={goldValueStyle}>±{prefs.angular_margin_deg}°</span>
        </div>
        <div className="flex gap-2">
          {[0.2, 0.5, 1.5].map(v => (
            <button
              key={v}
              onClick={() => setPrefs(p => ({ ...p, angular_margin_deg: v }))}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: prefs.angular_margin_deg === v ? 'rgba(232,200,72,0.2)' : 'rgba(255,255,255,0.05)',
                border: prefs.angular_margin_deg === v ? '1px solid #e8c848' : '1px solid rgba(255,255,255,0.07)',
                color: prefs.angular_margin_deg === v ? '#e8c848' : '#8892a4',
              }}
            >
              ±{v}°
            </button>
          ))}
        </div>
      </div>

      {/* Notification lead time */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={labelStyle}>{t('leadTime')}</span>
        <div className="flex gap-2">
          {[3, 5].map(v => (
            <button
              key={v}
              onClick={() => setPrefs(p => ({ ...p, notification_lead_min: v }))}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: prefs.notification_lead_min === v ? 'rgba(232,200,72,0.2)' : 'rgba(255,255,255,0.05)',
                border: prefs.notification_lead_min === v ? '1px solid #e8c848' : '1px solid rgba(255,255,255,0.07)',
                color: prefs.notification_lead_min === v ? '#e8c848' : '#8892a4',
              }}
            >
              {v} {t('leadUnit')}
            </button>
          ))}
        </div>
      </div>

      {/* Provider info (read-only) */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={labelStyle}>{t('provider')}</span>
        <span style={{ fontSize: 11, color: '#4ade80' }}>{t('providerAuto')}</span>
      </div>

      {/* GPS permission */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={labelStyle}>{t('gpsTitle')}</p>
          <p style={{ ...mutedStyle, marginTop: 2 }}>
            {mounted && gpsStatus === 'granted' && <span style={{ color: '#4ade80' }}>{t('gpsGranted')}</span>}
            {mounted && gpsStatus === 'denied' && <span style={{ color: '#f87171' }}>{t('gpsDenied')}</span>}
            {(!mounted || gpsStatus === 'prompt' || gpsStatus === 'unknown') && t('gpsPrompt')}
          </p>
        </div>
        {mounted && gpsStatus === 'prompt' && (
          <button
            onClick={() => navigator.geolocation.getCurrentPosition(() => setGpsStatus('granted'), () => setGpsStatus('denied'))}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(232,200,72,0.15)',
              border: '1px solid rgba(232,200,72,0.35)',
              color: '#e8c848',
              transition: 'all 0.15s',
            }}
          >
            {t('gpsRequest')}
          </button>
        )}
      </div>

      {/* Push notifications */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={labelStyle}>{t('notifTitle')}</p>
          <p style={{ ...mutedStyle, marginTop: 2 }}>
            {pushState === 'granted' && <span style={{ color: '#4ade80' }}>{t('notifGranted')}</span>}
            {pushState === 'denied' && <span style={{ color: '#f87171' }}>{t('notifDenied')}</span>}
            {(pushState === 'idle' || pushState === 'unsupported') && t('notifPrompt')}
          </p>
        </div>
        {pushState === 'idle' && (
          <button
            onClick={requestPush}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(232,200,72,0.15)',
              border: '1px solid rgba(232,200,72,0.35)',
              color: '#e8c848',
              transition: 'all 0.15s',
            }}
          >
            {t('notifRequest')}
          </button>
        )}
        {pushState === 'granted' && registraStatus !== 'ok' && (
          <button
            onClick={handleRegistra}
            disabled={registraStatus === 'sending'}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(232,200,72,0.12)',
              border: '1px solid rgba(232,200,72,0.25)',
              color: '#e8c848',
              opacity: registraStatus === 'sending' ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {registraStatus === 'sending' ? '...' : registraStatus === 'error' ? 'Errore' : 'Registra'}
          </button>
        )}
        {registraStatus === 'ok' && (
          <span style={{ fontSize: 11, color: '#4ade80', flexShrink: 0 }}>Registrato</span>
        )}
        {pushState === 'unsupported' && (
          <span style={{ ...mutedStyle, flexShrink: 0, textAlign: 'right' }}>iOS 16.4+{"\n"}+ home screen</span>
        )}
      </div>
      {registraError && (
        <p style={{ fontSize: 11, color: '#f87171', paddingLeft: 4 }}>{registraError}</p>
      )}

      {/* Background push notifications toggle */}
      {pushState === 'granted' && (
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={labelStyle}>{t('bgPushTitle')}</p>
            <p style={{ ...mutedStyle, marginTop: 2 }}>{t('bgPushDesc')}</p>
            <button
              onClick={sendTestPush}
              disabled={pushTestStatus === 'sending'}
              style={{
                marginTop: 6,
                fontSize: 11,
                color: pushTestStatus === 'ok' ? '#4ade80' : pushTestStatus === 'error' ? '#f87171' : '#e8c848',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                opacity: pushTestStatus === 'sending' ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {pushTestStatus === 'sending' && '...'}
              {pushTestStatus === 'ok' && 'Inviata!'}
              {pushTestStatus === 'error' && 'Errore'}
              {pushTestStatus === 'idle' && 'Invia notifica di test'}
            </button>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setPrefs(p => ({ ...p, background_push_enabled: !p.background_push_enabled }))}
            style={{
              flexShrink: 0,
              width: 48,
              height: 24,
              borderRadius: 999,
              position: 'relative',
              transition: 'all 0.2s',
              background: prefs.background_push_enabled ? 'rgba(232,200,72,0.2)' : 'rgba(255,255,255,0.1)',
              border: prefs.background_push_enabled ? '1px solid #e8c848' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: prefs.background_push_enabled ? 27 : 3,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: prefs.background_push_enabled ? '#e8c848' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }} />
          </button>
        </div>
      )}

      {/* Health check */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: healthResults ? 12 : 0 }}>
          <span style={labelStyle}>{t('healthTitle')}</span>
          <button
            onClick={runHealthCheck}
            disabled={healthLoading}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(232,200,72,0.12)',
              border: '1px solid rgba(232,200,72,0.25)',
              color: '#e8c848',
              opacity: healthLoading ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {healthLoading ? '...' : t('healthRun')}
          </button>
        </div>
        {healthResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {healthResults.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: p.status === 'ok' ? '#4ade80' : p.status === 'unconfigured' ? '#facc15' : '#f87171',
                    display: 'inline-block',
                  }} />
                  <span style={{ ...mutedStyle, fontFamily: 'monospace' }}>{p.name}</span>
                </div>
                <span style={{ color: 'rgba(232,234,240,0.3)', fontFamily: 'monospace' }}>
                  {p.status === 'ok' ? `${p.ms}ms` :
                   p.status === 'unconfigured' ? t('healthUnconfigured') :
                   t('healthError')}
                </span>
              </div>
            ))}
            {healthCheckedAt && (
              <p style={{ ...mutedStyle, fontSize: 10, paddingTop: 4, color: 'rgba(136,146,164,0.5)' }}>
                {new Date(healthCheckedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          borderRadius: 12,
          padding: '12px 0',
          fontSize: 14,
          fontWeight: 600,
          background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(232,200,72,0.18)',
          border: saved ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(232,200,72,0.4)',
          color: saved ? '#4ade80' : '#e8c848',
          opacity: saving ? 0.5 : 1,
          transition: 'all 0.2s',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? `${t('saved')}` : saving ? '...' : t('save')}
      </button>

      {/* Sign Out */}
      <button
        onClick={async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          window.location.replace('/')
        }}
        style={{
          width: '100%',
          borderRadius: 12,
          padding: '10px 0',
          fontSize: 13,
          fontWeight: 600,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
