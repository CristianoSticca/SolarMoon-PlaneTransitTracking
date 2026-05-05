'use client'

import { useTranslations } from 'next-intl'

type View = 'radar' | 'list' | 'map' | 'ar'

export function MonitorToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const t = useTranslations('monitor')

  return (
    <div className="flex rounded-full bg-white/8 p-1 gap-1">
      {(['radar', 'list', 'map', 'ar'] as View[]).map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
            view === v
              ? 'bg-violet-600/70 text-white shadow'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {v === 'radar' ? `📡 ${t('radar')}` : v === 'list' ? `☰ ${t('list')}` : v === 'map' ? `🗺️ ${t('map')}` : `📷 ${t('ar')}`}
        </button>
      ))}
    </div>
  )
}
