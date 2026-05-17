'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TransitEvent } from '@/lib/astronomy/transit'
import type { CelestialPosition } from '@/lib/astronomy/celestial'

function toCardinal(az: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(az / 45) % 8]
}

export function TransitAlert({
  event,
  celestialPos,
}: {
  event: TransitEvent | null
  celestialPos?: CelestialPosition
}) {
  const t = useTranslations('monitor')
  const [countdown, setCountdown] = useState(event?.countdown ?? 0)
  const [clockTime, setClockTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  )

  useEffect(() => {
    if (!event) return
    setCountdown(event.countdown)
    const id = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [event])

  useEffect(() => {
    const id = setInterval(() => {
      setClockTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      )
    }, 10000)
    return () => clearInterval(id)
  }, [])

  if (!event) return null

  const targetLabel = event.target === 'moon' ? t('moon') : t('sun')
  const isImminent = countdown <= 60
  const altM = Math.round(event.aircraft.altitudeFt * 0.3048)

  const headline =
    countdown <= 0
      ? t('transitHeadlineNow', { target: targetLabel })
      : countdown < 60
        ? t('transitHeadlineIn', { target: targetLabel, time: `${countdown}s` })
        : t('transitHeadlineIn', { target: targetLabel, time: `${Math.ceil(countdown / 60)} min` })

  return (
    <div
      className={`rounded-2xl p-4 mx-4 mb-4 transition-all${isImminent ? ' animate-pulse' : ''}`}
      style={{ background: 'rgba(12,16,26,0.97)', border: '1px solid rgba(232,200,72,0.28)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 mb-3"
        style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#e8a848', textTransform: 'uppercase' }}
      >
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#e8a848', flexShrink: 0 }} />
        {t('transitAlertLabel')} · {clockTime}
      </div>

      {/* Headline */}
      <div style={{ fontSize: 22, fontWeight: 700, color: '#e8eaf0', lineHeight: 1.2, marginBottom: 8 }}>
        {headline}
      </div>

      {/* Subtitle */}
      {celestialPos && (
        <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 14, lineHeight: 1.5 }}>
          {event.aircraft.callsign || event.aircraft.icao}
          {event.aircraft.aircraftType ? ` (${event.aircraft.aircraftType})` : ''}
          {' '}{t('onTrajectory')}{' '}
          {t('lookDirection', {
            az: celestialPos.azimuth.toFixed(0),
            cardinal: toCardinal(celestialPos.azimuth),
            el: celestialPos.altitude.toFixed(0),
          })}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 }} />

      {/* Data grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {celestialPos && (
          <>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 2 }}>{t('azimuth')}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#e8eaf0' }}>{celestialPos.azimuth.toFixed(1)}°</div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 2 }}>{t('elevation')}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#e8eaf0' }}>{celestialPos.altitude.toFixed(1)}°</div>
            </div>
          </>
        )}
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 2 }}>{t('separation')}</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#e8eaf0' }}>{event.minAngularSeparation.toFixed(2)}°</div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 2 }}>{t('aircraftAlt')}</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#e8eaf0' }}>{altM.toLocaleString()} m</div>
        </div>
      </div>
    </div>
  )
}
