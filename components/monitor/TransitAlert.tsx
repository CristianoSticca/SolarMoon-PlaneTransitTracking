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

  if (!event) return null

  const targetLabel = event.target === 'moon' ? `🌙 ${t('moon')}` : `☀️ ${t('sun')}`
  const isImminent = countdown < 60

  return (
    <div
      style={
        isImminent
          ? {
              border: '1px solid rgba(232,200,72,0.25)',
              background: 'rgba(232,200,72,0.12)',
            }
          : {
              border: '1px solid rgba(232,200,72,0.25)',
              background: 'rgba(232,200,72,0.12)',
            }
      }
      className={`rounded-xl px-4 py-3 flex items-center justify-between transition-all${isImminent ? ' animate-pulse' : ''}`}
    >
      <div>
        <div
          style={{ color: '#e8c848', fontFamily: 'monospace' }}
          className="text-xs tracking-widest uppercase"
        >
          ⬤ {event.aircraft.callsign || event.aircraft.icao} → {targetLabel}
        </div>
        <div style={{ color: '#8892a4' }} className="text-xs">
          {t('angularError', { deg: event.minAngularSeparation.toFixed(2) })}
        </div>
      </div>
      <div
        style={{ color: '#e8eaf0', fontFamily: 'monospace' }}
        className="text-2xl font-black tabular-nums"
      >
        {formatCountdown(countdown)}
      </div>
    </div>
  )
}
