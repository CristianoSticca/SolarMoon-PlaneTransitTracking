'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Prefs {
  language: string
  search_radius_km: number
  angular_margin_deg: number
  notification_lead_min: number
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

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('user_preferences').upsert({ user_id: userId, ...prefs })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (prefs.language !== locale) {
      router.push(`/${prefs.language}/settings`)
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
