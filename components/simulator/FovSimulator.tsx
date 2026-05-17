'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StepTarget }  from './steps/StepTarget'
import { StepCamera }  from './steps/StepCamera'
import { StepFocal }   from './steps/StepFocal'
import { StepPreview } from './steps/StepPreview'
import type { SimulatorState } from '@/lib/simulator/types'

const TOTAL_STEPS = 4

const DEFAULT_STATE: SimulatorState = {
  target:     'moon',
  cameraId:   'ff',
  focalMm:    600,
  aircraftId: 'b737',
}

export function FovSimulator() {
  const t = useTranslations('guide.simulator')
  const STEP_TITLES = t.raw('stepTitles') as string[]
  const [step, setState_step] = useState(1)
  const [state, setState] = useState<SimulatorState>(DEFAULT_STATE)

  const update = (partial: Partial<SimulatorState>) =>
    setState(s => ({ ...s, ...partial }))

  const goNext = () => setState_step(s => Math.min(s + 1, TOTAL_STEPS))
  const goBack = () => setState_step(s => Math.max(s - 1, 1))

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: '#07070f', color: '#d8d0c0' }}>

      {/* Nav header */}
      <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4">
        {step > 1 && (
          <button
            onClick={goBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#8a8070',
            }}
          >
            ‹
          </button>
        )}
        <h1 className="text-base font-semibold" style={{ color: '#f0e8d8' }}>
          {STEP_TITLES[step - 1]}
        </h1>
        <span
          className="ml-auto rounded-full px-3 py-0.5 text-xs"
          style={{ background: '#0e0e1c', border: '1px solid #1e1e2e', color: '#6a6070' }}
        >
          {t('stepOf').replace('{step}', String(step)).replace('{total}', String(TOTAL_STEPS))}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex shrink-0 justify-center gap-1.5 pb-4">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(i => (
          <div
            key={i}
            style={{
              height: 4,
              borderRadius: 2,
              background: i <= step ? '#c8b870' : '#1e1e2e',
              width: i === step ? 24 : 8,
              opacity: i < step ? 0.5 : 1,
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {step === 1 && (
          <StepTarget value={state.target} onChange={t => update({ target: t })} />
        )}
        {step === 2 && (
          <StepCamera value={state.cameraId} onChange={id => update({ cameraId: id })} />
        )}
        {step === 3 && (
          <StepFocal
            focalMm={state.focalMm}
            aircraftId={state.aircraftId}
            onFocalChange={mm => update({ focalMm: mm })}
            onAircraftChange={id => update({ aircraftId: id })}
          />
        )}
        {step === 4 && (
          <StepPreview state={state} onEdit={s => setState_step(s)} />
        )}
      </div>

      {/* Bottom CTA — extra padding for BottomNav */}
      <div
        className="shrink-0 px-5 pb-8 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {step < TOTAL_STEPS && (
          <button
            onClick={goNext}
            className="w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c8b870, #a08840)',
              color: '#1a1408',
              border: 'none',
            }}
          >
            Avanti →
          </button>
        )}
      </div>
    </div>
  )
}
