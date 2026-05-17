'use client'

import { useTranslations } from 'next-intl'
import { AIRCRAFT } from '@/lib/simulator/data'

const FOCAL_PRESETS = [200, 400, 600, 800, 1000, 1200]

const FOCAL_LABELS: Record<number, string> = {
  200: 'wide', 400: 'tele', 600: 'super', 800: 'ultra', 1000: '', 1200: '',
}

type Props = {
  focalMm: number
  aircraftId: string
  onFocalChange: (mm: number) => void
  onAircraftChange: (id: string) => void
}

export function StepFocal({ focalMm, aircraftId, onFocalChange, onAircraftChange }: Props) {
  const t = useTranslations('guide.simulator')
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight">{t('stepFocal')}</h2>
      <p className="text-sm" style={{ color: '#6a6070' }}>{t('stepFocalSub')}</p>

      {/* Focal presets grid */}
      <div className="grid grid-cols-3 gap-2">
        {FOCAL_PRESETS.map(mm => (
          <button
            key={mm}
            onClick={() => onFocalChange(mm)}
            className="rounded-xl py-3 text-center transition-all"
            style={{
              background: focalMm === mm ? 'rgba(200,184,112,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${focalMm === mm ? '#c8b870' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <span className="block text-xl font-bold" style={{ color: '#e8e0d0' }}>{mm}</span>
            <span className="mt-0.5 block text-xs" style={{ color: '#6a6070' }}>
              mm{FOCAL_LABELS[mm] ? ` — ${FOCAL_LABELS[mm]}` : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Custom slider */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="mb-2 text-xs" style={{ color: '#6a6070' }}>
          {t('customFocal')} —{' '}
          <span style={{ color: '#c8b870' }}>{focalMm}mm</span>
        </div>
        <input
          type="range"
          min={100}
          max={1200}
          step={25}
          value={focalMm}
          onChange={e => onFocalChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Aircraft */}
      <p className="text-sm" style={{ color: '#6a6070' }}>{t('aircraftType')}</p>
      {AIRCRAFT.map(ac => (
        <button
          key={ac.id}
          onClick={() => onAircraftChange(ac.id)}
          className="flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
          style={{
            background: aircraftId === ac.id ? 'rgba(200,184,112,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${aircraftId === ac.id ? '#c8b870' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <span className="text-2xl">✈️</span>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#e8e0d0' }}>{ac.name}</div>
            <div className="mt-0.5 text-xs" style={{ color: '#6a6070' }}>
              {t('wingspanLabel')} {ac.wingspan}m · {t('lengthLabel')} {ac.length}m
            </div>
          </div>
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
            style={{
              border: `1.5px solid ${aircraftId === ac.id ? '#c8b870' : 'rgba(255,255,255,0.12)'}`,
              background: aircraftId === ac.id ? '#c8b870' : 'transparent',
              color: aircraftId === ac.id ? '#1a1408' : 'transparent',
            }}
          >
            ✓
          </span>
        </button>
      ))}
    </div>
  )
}
