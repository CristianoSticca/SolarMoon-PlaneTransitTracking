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
                : 'border-white/8 bg-white/4'
            }`}
          >
            <div>
              <div className={`text-sm font-semibold ${isFirst ? 'text-green-400' : 'text-white/80'}`}>
                ✈ {ev.aircraft.callsign || ev.aircraft.icao} → {targetLabel}
              </div>
              <div className="text-white/30 text-xs">
                {t('angularError', { deg: ev.minAngularSeparation.toFixed(2) })}
              </div>
            </div>
            <div className={`font-mono text-lg font-bold tabular-nums ${isFirst ? 'text-white' : 'text-white/50'}`}>
              {formatCountdown(ev.countdown)}
            </div>
          </div>
        )
      })}

      {/* Nearby aircraft — not in transit */}
      {nearby.length > 0 && (
        <>
          <div className="text-white/20 text-xs px-1 pt-2">{t('nearbyTitle')}</div>
          {nearby.map((n) => {
            const targetLabel = n.target === 'moon' ? `🌙 ${t('moon')}` : `☀️ ${t('sun')}`
            return (
              <div
                key={`nearby-${n.aircraft.icao}-${n.target}`}
                className="rounded-xl px-4 py-3 flex items-center justify-between border border-white/5 bg-white/2 opacity-60"
              >
                <div>
                  <div className="text-sm text-white/50">
                    ✈ {n.aircraft.callsign || n.aircraft.icao} · {targetLabel}
                  </div>
                  <div className="text-white/25 text-xs">
                    min {n.minProjectedSeparationDeg.toFixed(2)}° · ora {n.currentSeparationDeg.toFixed(2)}°
                  </div>
                </div>
                <div className="text-white/25 text-xs font-mono">no transit</div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
