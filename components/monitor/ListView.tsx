'use client'

import { useTranslations } from 'next-intl'
import type { TransitEvent, NearbyAircraft } from '@/lib/astronomy/transit'

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ListView({ events, nearby }: { events: TransitEvent[]; nearby: NearbyAircraft[] }) {
  const t = useTranslations('monitor')

  const hasContent = events.length > 0 || nearby.length > 0

  if (!hasContent) {
    return (
      <div className="flex flex-1 items-center justify-center text-white/30 text-sm">
        {t('noTransits')}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 py-2">
      {/* Transit events */}
      {events.map((ev, i) => {
        const targetLabel = ev.target === 'moon' ? `🌙 ${t('moon')}` : `☀️ ${t('sun')}`
        const isFirst = i === 0
        return (
          <div
            key={`${ev.aircraft.icao}-${ev.target}-${ev.contactTimestamp}`}
            className={`rounded-xl px-4 py-3 flex items-center justify-between border transition-all ${
              isFirst
                ? 'border-green-400/40 bg-green-400/8'
                : ''
            }`}
            style={!isFirst ? { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' } : {}}
          >
            <div>
              <div className={`text-sm font-semibold ${isFirst ? 'text-green-400' : ''}`} style={!isFirst ? { color: '#e8eaf0' } : {}}>
                ✈ {ev.aircraft.callsign || ev.aircraft.icao} → {targetLabel}
              </div>
              <div className="text-xs" style={{ color: '#8892a4' }}>
                {t('angularError', { deg: ev.minAngularSeparation.toFixed(2) })}
              </div>
            </div>
            <div className={`font-mono text-lg font-bold tabular-nums ${isFirst ? 'text-white' : ''}`} style={!isFirst ? { color: '#8892a4' } : {}}>
              {formatCountdown(ev.countdown)}
            </div>
          </div>
        )
      })}

      {/* Nearby aircraft — not in transit */}
      {nearby.length > 0 && (
        <>
          <div className="text-xs px-1 pt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>{t('nearbyTitle')}</div>
          {nearby.map((n) => {
            const targetLabel = n.target === 'moon' ? `🌙 ${t('moon')}` : `☀️ ${t('sun')}`
            return (
              <div
                key={`nearby-${n.aircraft.icao}-${n.target}`}
                className="rounded-xl px-4 py-3 flex items-center justify-between opacity-60"
                style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div>
                  <div className="text-sm" style={{ color: '#8892a4' }}>
                    ✈ {n.aircraft.callsign || n.aircraft.icao} · {targetLabel}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    min {n.minProjectedSeparationDeg.toFixed(2)}° · ora {n.currentSeparationDeg.toFixed(2)}°
                  </div>
                </div>
                <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>no transit</div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
