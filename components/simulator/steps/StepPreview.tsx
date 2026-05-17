'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FovCanvas } from '../FovCanvas'
import { fovDeg, angularSizeDeg, pixelSpan } from '@/lib/simulator/fov'
import { CAMERAS, AIRCRAFT } from '@/lib/simulator/data'
import type { SimulatorState } from '@/lib/simulator/types'

const CANVAS_W = 700
const DIST_KM  = 10

const FOV_CATEGORY_COLORS = ['#c060e0', '#c8b870', '#70b0d8', '#70c870', '#c87070']

type Props = {
  state: SimulatorState
  onEdit: (step: number) => void
}

export function StepPreview({ state, onEdit }: Props) {
  const t = useTranslations('guide.simulator')
  const FOV_CATEGORY_LABELS = ['Astro', 'Super-tele', 'Tele', t('fovNormal'), 'Wide']
  const FOV_CATEGORIES = FOV_CATEGORY_COLORS.map((color, i) => ({
    max:   [2, 4, 8, 20, 999][i],
    label: FOV_CATEGORY_LABELS[i],
    color,
  }))
  const [planeX, setPlaneX] = useState(0.5)
  const [animating, setAnimating] = useState(false)
  const rafRef    = useRef<number | null>(null)
  const planeXRef = useRef(0.5)

  const cam = CAMERAS.find(c => c.id === state.cameraId) ?? CAMERAS[0]
  const ac  = AIRCRAFT.find(a => a.id === state.aircraftId) ?? AIRCRAFT[0]
  const fovH     = fovDeg(cam.sensorW, state.focalMm)
  const bodyPx   = pixelSpan(state.target === 'moon' ? 0.5 : 0.53, fovH, CANVAS_W)
  const acSpanPx = pixelSpan(angularSizeDeg(ac.wingspan, DIST_KM), fovH, CANVAS_W)

  // Stats
  const fovCat   = FOV_CATEGORIES.find(c => fovH < c.max) ?? FOV_CATEGORIES[FOV_CATEGORIES.length - 1]
  const lunaPct  = ((bodyPx / CANVAS_W) * 100).toFixed(0)
  const acVsLuna = Math.round((acSpanPx / bodyPx) * 100)
  const acVsColor = acVsLuna >= 30 ? '#00c878' : acVsLuna >= 15 ? '#ffb040' : '#e05050'

  // Fit badge
  const acPct    = acSpanPx / CANVAS_W
  const fitColor = acPct > 1.0 ? '#e05050' : acPct > 0.85 ? '#ffb040' : '#00c878'
  const fitTitle = acPct > 1.0 ? t('fitBad') : acPct > 0.85 ? t('fitWarn') : t('fitOk')
  const fitSub   = acPct > 1.0
    ? t('fitBadSub')
    : t('fitOkSub').replace('{pct}', ((acSpanPx / CANVAS_W) * 100).toFixed(0))

  // Animation
  const startAnimation = useCallback(() => {
    planeXRef.current = -0.35
    setPlaneX(-0.35)
    setAnimating(true)

    const loop = () => {
      planeXRef.current += 0.0022
      setPlaneX(planeXRef.current)
      if (planeXRef.current < 1.35) {
        rafRef.current = requestAnimationFrame(loop)
      } else {
        planeXRef.current = 0.5
        setPlaneX(0.5)
        setAnimating(false)
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const stopAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    planeXRef.current = 0.5
    setPlaneX(0.5)
    setAnimating(false)
  }, [])

  // Summary
  const summaryItems = [
    { label: t('summarySubject'), value: state.target === 'moon' ? t('moonLabel') : t('sunLabel'), step: 1 },
    { label: t('summaryCamera'),  value: cam.name,                                                  step: 2 },
    { label: t('summaryFocal'),   value: `${state.focalMm}mm (${Math.round(state.focalMm * cam.cropFactor)}mm equiv.)`, step: 3 },
    { label: t('summaryAircraft'), value: ac.name,                                                 step: 3 },
  ]

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">{t('stepPreview')}</h2>

      {/* Canvas */}
      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <FovCanvas state={state} planeXFraction={planeX} />
      </div>

      {/* Fit badge */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: `${fitColor}18`, border: `1px solid ${fitColor}4d` }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fitColor }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: fitColor }}>{fitTitle}</div>
          <div className="text-xs" style={{ color: fitColor, opacity: 0.8 }}>{fitSub}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {/* FOV */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="block text-base font-bold" style={{ color: '#c8b870' }}>{fovH.toFixed(1)}°</span>
          <span className="mt-1 block text-xs font-semibold" style={{ color: fovCat.color }}>{fovCat.label}</span>
          <span className="mt-0.5 block text-xs uppercase tracking-wide" style={{ color: '#4a4050' }}>{t('statField')}</span>
        </div>
        {/* Luna */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="block text-base font-bold" style={{ color: '#c8b870' }}>{Math.round(bodyPx)}px</span>
          <span className="mt-1 block text-xs" style={{ color: '#6a6070' }}>{lunaPct}{t('ofFrame')}</span>
          <span className="mt-0.5 block text-xs uppercase tracking-wide" style={{ color: '#4a4050' }}>{t('statMoon')}</span>
        </div>
        {/* Aereo vs Luna */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="block text-base font-bold" style={{ color: acVsColor }}>{acVsLuna}%</span>
          <span className="mt-1 block text-xs" style={{ color: '#6a6070' }}>{t('ofDisk')}</span>
          <span className="mt-0.5 block text-xs uppercase tracking-wide" style={{ color: '#4a4050' }}>{t('statAircraft')}</span>
        </div>
      </div>

      {/* Animate button */}
      <button
        onClick={animating ? stopAnimation : startAnimation}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold transition-all"
        style={{
          background: animating ? 'rgba(255,176,64,0.08)' : 'rgba(80,80,180,0.12)',
          border: `1.5px solid ${animating ? '#ffb040' : 'rgba(100,100,200,0.4)'}`,
          color: animating ? '#ffb040' : '#a0a0e0',
        }}
      >
        <span>{animating ? '⏸' : '▶'}</span>
        <span>{animating ? t('pauseBtn') : t('animateBtn')}</span>
      </button>

      {/* Summary card */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {summaryItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: i < summaryItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
          >
            <span className="w-16 shrink-0 text-xs" style={{ color: '#6a6070' }}>{item.label}</span>
            <span className="flex-1 px-2 text-sm font-medium" style={{ color: '#d0c8b8' }}>{item.value}</span>
            <button
              onClick={() => onEdit(item.step)}
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(200,184,112,0.1)', color: '#c8b870' }}
            >
              {t('editBtn')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
