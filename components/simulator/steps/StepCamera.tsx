'use client'

import { CAMERAS } from '@/lib/simulator/data'
import type { CameraId } from '@/lib/simulator/types'

type Props = {
  value: CameraId
  onChange: (id: CameraId) => void
}

const ICONS: Record<CameraId, string> = {
  ff: '📷', apsc_c: '📸', apsc_s: '📸', m43: '🎞',
}

export function StepCamera({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">Che corpo macchina usi?</h2>
      <p className="text-sm" style={{ color: '#6a6070' }}>Il sensore determina il campo inquadrato</p>
      {CAMERAS.map(cam => (
        <button
          key={cam.id}
          onClick={() => onChange(cam.id)}
          className="flex items-center gap-4 rounded-2xl p-4 text-left transition-all"
          style={{
            background: value === cam.id ? 'rgba(200,184,112,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${value === cam.id ? '#c8b870' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {ICONS[cam.id]}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#e8e0d0' }}>{cam.name}</div>
            <div className="mt-0.5 text-xs" style={{ color: '#6a6070' }}>
              {cam.sensorW}×{cam.sensorH}mm · crop ×{cam.cropFactor}
            </div>
          </div>
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
            style={{
              border: `1.5px solid ${value === cam.id ? '#c8b870' : 'rgba(255,255,255,0.12)'}`,
              background: value === cam.id ? '#c8b870' : 'transparent',
              color: value === cam.id ? '#1a1408' : 'transparent',
            }}
          >
            ✓
          </span>
        </button>
      ))}
    </div>
  )
}
