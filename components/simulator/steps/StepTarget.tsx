'use client'

import { useTranslations } from 'next-intl'
import type { Target } from '@/lib/simulator/types'

type Props = {
  value: Target
  onChange: (t: Target) => void
}

export function StepTarget({ value, onChange }: Props) {
  const t = useTranslations('guide.simulator')
  const OPTIONS: { id: Target; icon: string; label: string; sub: string }[] = [
    { id: 'moon', icon: '🌕', label: t('moonLabel'), sub: t('moonSub') },
    { id: 'sun',  icon: '☀️', label: t('sunLabel'),  sub: t('sunSub') },
  ]
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">{t('stepTarget')}</h2>
      <p className="text-sm" style={{ color: '#6a6070' }}>{t('stepTargetSub')}</p>
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
          style={{
            background: value === opt.id ? 'rgba(200,184,112,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${value === opt.id ? '#c8b870' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {opt.icon}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#e8e0d0' }}>{opt.label}</div>
            <div className="mt-0.5 text-xs" style={{ color: '#6a6070' }}>{opt.sub}</div>
          </div>
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
            style={{
              border: `1.5px solid ${value === opt.id ? '#c8b870' : 'rgba(255,255,255,0.12)'}`,
              background: value === opt.id ? '#c8b870' : 'transparent',
              color: value === opt.id ? '#1a1408' : 'transparent',
            }}
          >
            ✓
          </span>
        </button>
      ))}
    </div>
  )
}
