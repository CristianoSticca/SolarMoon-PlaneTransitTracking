'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function OnboardingSteps({
  userId,
  locale,
}: {
  userId: string
  locale: string
}) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [gpsGranted, setGpsGranted] = useState(false)
  const { state: pushState, request: requestPush } = usePushNotifications()

  async function requestGps() {
    try {
      await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      )
      setGpsGranted(true)
    } catch {
      // User denied — they can still use the app (will be prompted on monitor page)
    }
  }

  function promptInstall() {
    const ev = (
      window as Window & { __a2hsEvent?: { prompt: () => void } }
    ).__a2hsEvent
    if (ev) ev.prompt()
  }

  async function finish() {
    await createClient()
      .from('user_preferences')
      .upsert({
        user_id: userId,
        language: locale,
        search_radius_km: 25,
        angular_margin_deg: 0.5,
        notification_lead_min: 3,
      })
    router.push(`/${locale}/monitor`)
  }

  const isStandalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches

  const steps = [
    {
      icon: '📍',
      title: t('gps.title'),
      desc: t('gps.desc'),
      action: t('gps.action'),
      done: gpsGranted,
      onAction: requestGps,
    },
    {
      icon: '🔔',
      title: t('notifications.title'),
      desc: t('notifications.desc'),
      action: t('notifications.action'),
      done: pushState === 'granted',
      onAction: requestPush,
    },
    {
      icon: '📲',
      title: t('install.title'),
      desc: t('install.desc'),
      action: t('install.action'),
      done: isStandalone,
      onAction: promptInstall,
    },
  ]

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div
          key={i}
          style={
            step.done
              ? { border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)' }
              : { border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }
          }
          className="rounded-xl px-4 py-4 flex items-center gap-4 transition-all"
        >
          <span className="text-2xl flex-shrink-0">{step.icon}</span>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold"
              style={{ color: step.done ? '#4ade80' : '#e8eaf0' }}
            >
              {step.title}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#8892a4' }}>{step.desc}</div>
          </div>
          {step.done ? (
            <span className="text-lg flex-shrink-0" style={{ color: '#4ade80' }}>✓</span>
          ) : (
            <button
              onClick={step.onAction}
              style={{
                background: 'rgba(232,200,72,0.15)',
                border: '1px solid rgba(232,200,72,0.4)',
                color: '#e8c848',
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0"
            >
              {step.action}
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={finish}
          style={{
            background: 'rgba(232,200,72,0.15)',
            border: '1px solid rgba(232,200,72,0.4)',
            color: '#e8c848',
          }}
          className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
        >
          {t('continue')}
        </button>
        <button
          onClick={finish}
          className="px-4 rounded-xl text-sm transition-colors"
          style={{ color: '#8892a4' }}
        >
          {t('skip')}
        </button>
      </div>
    </div>
  )
}
