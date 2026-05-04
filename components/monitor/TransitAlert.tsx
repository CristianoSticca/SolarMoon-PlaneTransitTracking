'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TransitEvent } from '@/lib/astronomy/transit'

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TransitAlert({ event }: { event: TransitEvent | null }) {
  const t = useTranslations('monitor')
  const [countdown, setCountdown] = useState(event?.countdown ?? 0)

  useEffect(() => {
    if (!event) return
    setCountdown(event.countdown)
    const id = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [event])

  if (!event) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-white/40 text-sm">
        {t('noTransits')}
      </div>
    )
  }

  const targetLabel = event.target === 'moon' ? `🌙 ${t('moon')}` : `☀️ ${t('sun')}`
  const isImminent = countdown < 60

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between transition-all ${
      isImminent
        ? 'border-green-400/60 bg-green-400/10 animate-pulse'
        : 'border-green-400/30 bg-green-400/8'
    }`}>
      <div>
        <div className="text-green-400 text-xs tracking-widest uppercase font-mono">
          ⬤ {event.aircraft.callsign || event.aircraft.icao} → {targetLabel}
        </div>
        <div className="text-white/40 text-xs">
          {t('angularError', { deg: event.minAngularSeparation.toFixed(2) })}
        </div>
      </div>
      <div className="text-white text-2xl font-black font-mono tabular-nums">
        {formatCountdown(countdown)}
      </div>
    </div>
  )
}
