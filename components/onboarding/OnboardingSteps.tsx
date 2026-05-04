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
          className={`rounded-xl border px-4 py-4 flex items-center gap-4 transition-all ${
            step.done
              ? 'border-green-400/30 bg-green-400/8'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <span className="text-2xl flex-shrink-0">{step.icon}</span>
          <div className="flex-1 min-w-0">
            <div
              className={`text-sm font-semibold ${
                step.done ? 'text-green-400' : 'text-white/80'
              }`}
            >
              {step.title}
            </div>
            <div className="text-xs text-white/40 mt-0.5">{step.desc}</div>
          </div>
          {step.done ? (
            <span className="text-green-400 text-lg flex-shrink-0">✓</span>
          ) : (
            <button
              onClick={step.onAction}
              className="px-3 py-1.5 rounded-full bg-violet-600/60 text-xs font-semibold hover:bg-violet-600 transition-colors flex-shrink-0"
            >
              {step.action}
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={finish}
          className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold hover:bg-violet-500 transition-colors"
        >
          {t('continue')}
        </button>
        <button
          onClick={finish}
          className="px-4 rounded-xl text-white/30 hover:text-white/50 text-sm transition-colors"
        >
          {t('skip')}
        </button>
      </div>
    </div>
  )
}
