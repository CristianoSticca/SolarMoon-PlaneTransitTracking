# FOV Simulator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-step mobile wizard at `/[locale]/simulator` that renders a realistic Canvas preview of how the Moon/Sun and a transiting aircraft will look through a given camera + lens combination.

**Architecture:** Wizard state lives in `FovSimulator.tsx` and is passed down as props. All FOV math is pure functions in `lib/simulator/fov.ts`. The canvas is rendered imperatively in `FovCanvas.tsx` — no React state inside the draw loop.

**Tech Stack:** Next.js App Router, React, TypeScript, HTML5 Canvas 2D, next-intl, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/simulator/types.ts` | Camera, Aircraft, SimulatorState types |
| Create | `lib/simulator/data.ts` | CAMERAS and AIRCRAFT constant arrays |
| Create | `lib/simulator/fov.ts` | Pure math: fovDeg, angularSizeDeg, pixelSpan |
| Create | `lib/simulator/__tests__/fov.test.ts` | Unit tests for math |
| Create | `components/simulator/FovCanvas.tsx` | Imperative canvas renderer |
| Create | `components/simulator/steps/StepTarget.tsx` | Step 1 UI |
| Create | `components/simulator/steps/StepCamera.tsx` | Step 2 UI |
| Create | `components/simulator/steps/StepFocal.tsx` | Step 3 UI (focal + aircraft) |
| Create | `components/simulator/steps/StepPreview.tsx` | Step 4 UI (canvas + stats + animate) |
| Create | `components/simulator/FovSimulator.tsx` | Wizard shell: step state + navigation |
| Create | `app/[locale]/simulator/page.tsx` | Route page (server component) |
| Modify | `components/layout/BottomNav.tsx` | Add simulator tab |
| Modify | `messages/it.json` | Add `simulator` and `nav.simulator` keys |
| Modify | `messages/en.json` | Add `simulator` and `nav.simulator` keys |

---

## Task 1: Types and data constants

**Files:**
- Create: `lib/simulator/types.ts`
- Create: `lib/simulator/data.ts`

- [ ] **Step 1.1 — Create types**

```ts
// lib/simulator/types.ts

export type Target = 'moon' | 'sun'

export type CameraId = 'ff' | 'apsc_c' | 'apsc_s' | 'm43'

export type Camera = {
  id: CameraId
  name: string
  sensorW: number   // mm
  sensorH: number   // mm
  cropFactor: number
}

export type Aircraft = {
  id: string
  name: string
  wingspan: number  // meters
  length: number    // meters
}

export type SimulatorState = {
  target: Target
  cameraId: CameraId
  focalMm: number
  aircraftId: string
}
```

- [ ] **Step 1.2 — Create data constants**

```ts
// lib/simulator/data.ts

import type { Camera, Aircraft } from './types'

export const CAMERAS: Camera[] = [
  { id: 'ff',     name: 'Full Frame',      sensorW: 36.0, sensorH: 24.0, cropFactor: 1.0 },
  { id: 'apsc_c', name: 'APS-C Canon',     sensorW: 22.3, sensorH: 14.9, cropFactor: 1.6 },
  { id: 'apsc_s', name: 'APS-C Sony/Nikon',sensorW: 23.5, sensorH: 15.6, cropFactor: 1.5 },
  { id: 'm43',    name: 'Micro 4/3',       sensorW: 17.3, sensorH: 13.0, cropFactor: 2.0 },
]

export const AIRCRAFT: Aircraft[] = [
  { id: 'b737', name: 'Boeing 737-800',       wingspan: 35.8, length: 39.5 },
  { id: 'a320', name: 'Airbus A320',          wingspan: 35.8, length: 37.6 },
  { id: 'b787', name: 'Boeing 787 Dreamliner',wingspan: 60.1, length: 57.0 },
  { id: 'a380', name: 'Airbus A380',          wingspan: 79.75,length: 73.0 },
  { id: 'crj2', name: 'CRJ-200 Regional',     wingspan: 21.0, length: 26.0 },
]
```

- [ ] **Step 1.3 — Commit**

```bash
git add lib/simulator/types.ts lib/simulator/data.ts
git commit -m "feat(simulator): add types and data constants"
```

---

## Task 2: FOV math library (TDD)

**Files:**
- Create: `lib/simulator/fov.ts`
- Create: `lib/simulator/__tests__/fov.test.ts`

- [ ] **Step 2.1 — Write failing tests**

```ts
// lib/simulator/__tests__/fov.test.ts

import { fovDeg, angularSizeDeg, pixelSpan } from '../fov'

describe('fovDeg', () => {
  it('computes horizontal FOV for 400mm Full Frame', () => {
    // 2 * atan(36 / (2 * 400)) = 2 * atan(0.045) ≈ 5.157°
    expect(fovDeg(36, 400)).toBeCloseTo(5.157, 2)
  })

  it('computes FOV for 600mm Full Frame', () => {
    // 2 * atan(36 / 1200) ≈ 3.438°
    expect(fovDeg(36, 600)).toBeCloseTo(3.438, 2)
  })

  it('computes FOV for 400mm APS-C Canon (22.3mm sensor)', () => {
    // 2 * atan(22.3 / 800) ≈ 3.19°
    expect(fovDeg(22.3, 400)).toBeCloseTo(3.190, 2)
  })
})

describe('angularSizeDeg', () => {
  it('computes angular size of a 737 wingspan (35.8m) at 10km', () => {
    // 2 * atan(35.8 / (2 * 10000)) = 2 * atan(0.00179) ≈ 0.2051°
    expect(angularSizeDeg(35.8, 10)).toBeCloseTo(0.2051, 3)
  })

  it('returns ~0.5° for the Moon (angular diameter constant check)', () => {
    // Moon diameter ~3474km at ~384400km distance ≈ 0.518°
    // We only test our formula with known values, not the astronomical constant
    expect(angularSizeDeg(3474000, 384400)).toBeCloseTo(0.518, 1)
  })
})

describe('pixelSpan', () => {
  it('computes pixel span of the Moon on a 700px-wide canvas at 5.157° FOV', () => {
    // 700 * (0.5 / 5.157) ≈ 67.8px
    expect(pixelSpan(0.5, 5.157, 700)).toBeCloseTo(67.8, 0)
  })

  it('is proportional: doubling FOV halves pixel span', () => {
    const span1 = pixelSpan(0.5, 5, 700)
    const span2 = pixelSpan(0.5, 10, 700)
    expect(span1).toBeCloseTo(span2 * 2, 1)
  })
})
```

- [ ] **Step 2.2 — Run tests to confirm they fail**

```bash
npx jest lib/simulator/__tests__/fov.test.ts --no-coverage
```

Expected: 5 failing tests ("Cannot find module '../fov'")

- [ ] **Step 2.3 — Implement math functions**

```ts
// lib/simulator/fov.ts

const toDeg = (rad: number) => rad * (180 / Math.PI)

/**
 * Field of View in degrees for a given sensor dimension and focal length.
 * @param sensorMm  sensor width or height in millimetres
 * @param focalMm   focal length in millimetres
 */
export function fovDeg(sensorMm: number, focalMm: number): number {
  return 2 * toDeg(Math.atan(sensorMm / (2 * focalMm)))
}

/**
 * Angular size of an object in degrees.
 * @param sizeMeters  physical size of object (wingspan, diameter) in metres
 * @param distKm      distance to object in kilometres
 */
export function angularSizeDeg(sizeMeters: number, distKm: number): number {
  return 2 * toDeg(Math.atan(sizeMeters / (2 * distKm * 1000)))
}

/**
 * Pixel span of an angular object on a canvas.
 * @param angularDeg   angular size of object in degrees
 * @param fovHDeg      horizontal FOV of the frame in degrees
 * @param canvasW      canvas width in pixels
 */
export function pixelSpan(angularDeg: number, fovHDeg: number, canvasW: number): number {
  return canvasW * (angularDeg / fovHDeg)
}
```

- [ ] **Step 2.4 — Run tests to confirm they pass**

```bash
npx jest lib/simulator/__tests__/fov.test.ts --no-coverage
```

Expected: 5 passing tests

- [ ] **Step 2.5 — Commit**

```bash
git add lib/simulator/fov.ts lib/simulator/__tests__/fov.test.ts
git commit -m "feat(simulator): add FOV math library with tests"
```

---

## Task 3: FovCanvas component

**Files:**
- Create: `components/simulator/FovCanvas.tsx`

- [ ] **Step 3.1 — Create FovCanvas**

```tsx
// components/simulator/FovCanvas.tsx
'use client'

import { useEffect, useRef } from 'react'
import { fovDeg, angularSizeDeg, pixelSpan } from '@/lib/simulator/fov'
import { CAMERAS, AIRCRAFT } from '@/lib/simulator/data'
import type { SimulatorState } from '@/lib/simulator/types'

const CANVAS_W = 700
const CANVAS_H = 467   // 3:2 ratio
const DIST_KM  = 10    // fixed aircraft distance

export type FovCanvasProps = {
  state: SimulatorState
  planeXFraction?: number  // 0..1, horizontal position of aircraft centre
}

export function FovCanvas({ state, planeXFraction = 0.5 }: FovCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawFrame(ctx, state, planeXFraction)
  }, [state, planeXFraction])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  )
}

// ─── Drawing ────────────────────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: SimulatorState,
  planeXFraction: number,
) {
  const W = CANVAS_W
  const H = CANVAS_H
  const cam = CAMERAS.find(c => c.id === state.cameraId) ?? CAMERAS[0]
  const ac  = AIRCRAFT.find(a => a.id === state.aircraftId) ?? AIRCRAFT[0]
  const fovH = fovDeg(cam.sensorW, state.focalMm)

  const bodyAngDiam = state.target === 'moon' ? 0.5 : 0.53
  const bodyPx   = pixelSpan(bodyAngDiam, fovH, W)
  const acSpanPx = pixelSpan(angularSizeDeg(ac.wingspan, DIST_KM), fovH, W)
  const acLenPx  = pixelSpan(angularSizeDeg(ac.length,   DIST_KM), fovH, W)

  // Background
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W)
  bg.addColorStop(0, '#0e0e20')
  bg.addColorStop(1, '#040408')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Stars (deterministic positions via simple LCG for consistency)
  let seed = 42
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff }
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.04 + 0.005})`
    ctx.fillRect(rand() * W, rand() * H, rand() < 0.2 ? 2 : 1, rand() < 0.2 ? 2 : 1)
  }

  // Rule-of-thirds grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  ;[1, 2].forEach(i => {
    ctx.beginPath(); ctx.moveTo((W / 3) * i, 0); ctx.lineTo((W / 3) * i, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, (H / 3) * i); ctx.lineTo(W, (H / 3) * i); ctx.stroke()
  })

  // Frame border
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

  // Moon or Sun
  const cx = W / 2
  const cy = H / 2
  const r  = bodyPx / 2

  if (state.target === 'moon') {
    const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3)
    glow.addColorStop(0, 'rgba(210,195,160,0.18)')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill()

    const mg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r)
    mg.addColorStop(0, '#f2e8c8')
    mg.addColorStop(0.6, '#d0b878')
    mg.addColorStop(1, '#906030')
    ctx.fillStyle = mg
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()

    ;[
      { rx: -0.28, ry: -0.15, rr: 0.09 },
      { rx:  0.20, ry:  0.28, rr: 0.07 },
      { rx: -0.08, ry:  0.30, rr: 0.05 },
      { rx:  0.30, ry: -0.10, rr: 0.08 },
    ].forEach(c => {
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.beginPath(); ctx.arc(cx + c.rx * r, cy + c.ry * r, c.rr * r, 0, Math.PI * 2); ctx.fill()
    })
  } else {
    const sg = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 5)
    sg.addColorStop(0, 'rgba(255,200,40,0.22)')
    sg.addColorStop(0.4, 'rgba(255,120,0,0.07)')
    sg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = sg
    ctx.beginPath(); ctx.arc(cx, cy, r * 5, 0, Math.PI * 2); ctx.fill()

    const sd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    sd.addColorStop(0, '#fffce0')
    sd.addColorStop(0.5, '#ffd030')
    sd.addColorStop(1, '#ff7000')
    ctx.fillStyle = sd
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }

  // Trajectory dashed line
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 8])
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.setLineDash([])

  // Aircraft
  drawAircraft(ctx, planeXFraction * W, cy, acLenPx, acSpanPx)

  // HUD labels
  ctx.font = '16px -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.textAlign = 'left'
  ctx.fillText(`${cam.name} · ${state.focalMm}mm`, 10, H - 10)
  ctx.textAlign = 'right'
  ctx.fillText(`FOV ${fovH.toFixed(1)}°`, W - 10, H - 10)
}

function drawAircraft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lenPx: number,
  spanPx: number,
) {
  ctx.save()
  ctx.translate(x, y)
  const bH = spanPx * 0.055
  const wH = spanPx * 0.065
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 8

  // Fuselage
  ctx.fillStyle = '#c0b8b8'
  ctx.beginPath()
  ctx.moveTo(-lenPx / 2, -bH / 2)
  ctx.bezierCurveTo(-lenPx / 2 + lenPx * 0.06, -bH * 1.1, lenPx * 0.25, -bH * 1.1, lenPx / 2, -bH * 0.3)
  ctx.bezierCurveTo(lenPx / 2 + lenPx * 0.02, 0, lenPx / 2, bH * 0.3, lenPx / 2 - lenPx * 0.06, bH * 0.5)
  ctx.bezierCurveTo(lenPx * 0.25, bH, -lenPx * 0.25, bH, -lenPx / 2, bH / 2)
  ctx.closePath()
  ctx.fill()

  // Wings (top + bottom)
  ;([[1, -1], [1, 1]] as [number, number][]).forEach(([, sy]) => {
    ctx.fillStyle = '#a8a0a0'
    ctx.beginPath()
    ctx.moveTo(-lenPx * 0.05, 0)
    ctx.lineTo(lenPx * 0.18, 0)
    ctx.lineTo(spanPx * 0.46, wH * 2.2 * sy)
    ctx.lineTo(spanPx * 0.46, wH * 3.2 * sy)
    ctx.lineTo(lenPx * 0.04, wH * 1.5 * sy)
    ctx.closePath()
    ctx.fill()
  })

  // Tail fin
  ctx.fillStyle = '#9898a0'
  ctx.beginPath()
  ctx.moveTo(lenPx * 0.34, -bH * 0.3)
  ctx.lineTo(lenPx * 0.48, -bH * 3.5)
  ctx.lineTo(lenPx * 0.5, -bH * 4)
  ctx.lineTo(lenPx * 0.28, -bH * 0.7)
  ctx.closePath()
  ctx.fill()

  // Engine pods (×4, symmetrical)
  ;([0.18, 0.30] as number[]).forEach(ef => {
    const ev = ef === 0.18 ? 1.3 : 2.0
    ;([-1, 1] as number[]).forEach(s => {
      ctx.fillStyle = '#707070'
      ctx.beginPath()
      ctx.ellipse(lenPx * 0.03 + spanPx * ef * 0.28, wH * ev * s, lenPx * 0.055, bH * 0.65, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  })

  ctx.shadowBlur = 0
  ctx.restore()
}
```

- [ ] **Step 3.2 — Commit**

```bash
git add components/simulator/FovCanvas.tsx
git commit -m "feat(simulator): add FovCanvas imperative renderer"
```

---

## Task 4: Step components

**Files:**
- Create: `components/simulator/steps/StepTarget.tsx`
- Create: `components/simulator/steps/StepCamera.tsx`
- Create: `components/simulator/steps/StepFocal.tsx`
- Create: `components/simulator/steps/StepPreview.tsx`

- [ ] **Step 4.1 — StepTarget**

```tsx
// components/simulator/steps/StepTarget.tsx
'use client'

import type { Target } from '@/lib/simulator/types'

type Props = {
  value: Target
  onChange: (t: Target) => void
}

const OPTIONS: { id: Target; icon: string; labelKey: string; sub: string }[] = [
  { id: 'moon', icon: '🌕', labelKey: 'Luna',  sub: 'Diametro apparente ~0.50°' },
  { id: 'sun',  icon: '☀️', labelKey: 'Sole',  sub: 'Diametro apparente ~0.53°' },
]

export function StepTarget({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">Cosa stai fotografando?</h2>
      <p className="text-sm" style={{ color: '#6a6070' }}>Seleziona il soggetto del transito</p>
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            {opt.icon}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#e8e0d0' }}>{opt.labelKey}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6a6070' }}>{opt.sub}</div>
          </div>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
            style={{
              border: `1.5px solid ${value === opt.id ? '#c8b870' : 'rgba(255,255,255,0.12)'}`,
              background: value === opt.id ? '#c8b870' : 'transparent',
              color: value === opt.id ? '#1a1408' : 'transparent',
            }}>
            ✓
          </span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4.2 — StepCamera**

```tsx
// components/simulator/steps/StepCamera.tsx
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            {ICONS[cam.id]}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: '#e8e0d0' }}>{cam.name}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6a6070' }}>
              {cam.sensorW}×{cam.sensorH}mm · crop ×{cam.cropFactor}
            </div>
          </div>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
            style={{
              border: `1.5px solid ${value === cam.id ? '#c8b870' : 'rgba(255,255,255,0.12)'}`,
              background: value === cam.id ? '#c8b870' : 'transparent',
              color: value === cam.id ? '#1a1408' : 'transparent',
            }}>
            ✓
          </span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4.3 — StepFocal**

```tsx
// components/simulator/steps/StepFocal.tsx
'use client'

import { AIRCRAFT } from '@/lib/simulator/data'

const FOCAL_PRESETS = [200, 400, 600, 800, 1000, 1200]

const FOCAL_LABELS: Record<number, string> = {
  200: 'wide', 400: 'tele', 600: 'super',
  800: 'ultra', 1000: '', 1200: '',
}

type Props = {
  focalMm: number
  aircraftId: string
  onFocalChange: (mm: number) => void
  onAircraftChange: (id: string) => void
}

export function StepFocal({ focalMm, aircraftId, onFocalChange, onAircraftChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight">Focale e aereo</h2>
      <p className="text-sm" style={{ color: '#6a6070' }}>Scegli la focale e il tipo di aereo</p>

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
            <span className="block text-xs mt-0.5" style={{ color: '#6a6070' }}>
              mm{FOCAL_LABELS[mm] ? ` — ${FOCAL_LABELS[mm]}` : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Custom slider */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-xs mb-2" style={{ color: '#6a6070' }}>
          Focale personalizzata —{' '}
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
      <p className="text-sm" style={{ color: '#6a6070' }}>Tipo di aereo</p>
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
            <div className="text-xs mt-0.5" style={{ color: '#6a6070' }}>
              Apertura alare {ac.wingspan}m · Lunghezza {ac.length}m
            </div>
          </div>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
            style={{
              border: `1.5px solid ${aircraftId === ac.id ? '#c8b870' : 'rgba(255,255,255,0.12)'}`,
              background: aircraftId === ac.id ? '#c8b870' : 'transparent',
              color: aircraftId === ac.id ? '#1a1408' : 'transparent',
            }}>
            ✓
          </span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4.4 — StepPreview**

```tsx
// components/simulator/steps/StepPreview.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import { FovCanvas } from '../FovCanvas'
import { fovDeg, angularSizeDeg, pixelSpan } from '@/lib/simulator/fov'
import { CAMERAS, AIRCRAFT } from '@/lib/simulator/data'
import type { SimulatorState } from '@/lib/simulator/types'

const CANVAS_W = 700
const DIST_KM  = 10

const FOV_CATEGORIES = [
  { max: 2,   label: 'Astro',      color: '#c060e0' },
  { max: 4,   label: 'Super-tele', color: '#c8b870' },
  { max: 8,   label: 'Tele',       color: '#70b0d8' },
  { max: 20,  label: 'Normale',    color: '#70c870' },
  { max: 999, label: 'Wide',       color: '#c87070' },
]

type Props = {
  state: SimulatorState
  onEdit: (step: number) => void
}

export function StepPreview({ state, onEdit }: Props) {
  const [planeX, setPlaneX] = useState(0.5)
  const [animating, setAnimating] = useState(false)
  const rafRef = useRef<number | null>(null)
  const planeXRef = useRef(0.5)

  const cam = CAMERAS.find(c => c.id === state.cameraId) ?? CAMERAS[0]
  const ac  = AIRCRAFT.find(a => a.id === state.aircraftId) ?? AIRCRAFT[0]
  const fovH    = fovDeg(cam.sensorW, state.focalMm)
  const bodyPx  = pixelSpan(state.target === 'moon' ? 0.5 : 0.53, fovH, CANVAS_W)
  const acSpanPx = pixelSpan(angularSizeDeg(ac.wingspan, DIST_KM), fovH, CANVAS_W)

  // Stats
  const fovCat   = FOV_CATEGORIES.find(c => fovH < c.max)!
  const lunaPct  = ((bodyPx / CANVAS_W) * 100).toFixed(0)
  const acVsLuna = Math.round((acSpanPx / bodyPx) * 100)
  const acVsColor = acVsLuna >= 30 ? '#00c878' : acVsLuna >= 15 ? '#ffb040' : '#e05050'

  // Fit badge
  const acPct = acSpanPx / CANVAS_W
  const fitColor = acPct > 1.0 ? '#e05050' : acPct > 0.85 ? '#ffb040' : '#00c878'
  const fitTitle = acPct > 1.0 ? '✗ Fuori dal frame' : acPct > 0.85 ? '⚠ Margine ridotto' : '✓ Aereo nel frame'
  const fitSub   = acPct > 1.0
    ? 'Riduci la focale per includere l\'aereo'
    : `L'aereo occupa ${((acSpanPx / CANVAS_W) * 100).toFixed(0)}% del frame`

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

  // Summary labels
  const summaryItems = [
    { label: 'Soggetto',  value: state.target === 'moon' ? 'Luna' : 'Sole', step: 1 },
    { label: 'Camera',    value: cam.name,                                    step: 2 },
    { label: 'Focale',    value: `${state.focalMm}mm (${Math.round(state.focalMm * cam.cropFactor)}mm equiv.)`, step: 3 },
    { label: 'Aereo',     value: ac.name,                                     step: 3 },
  ]

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">Preview del tuo scatto</h2>

      {/* Canvas */}
      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <FovCanvas state={state} planeXFraction={planeX} />
      </div>

      {/* Fit badge */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: `${fitColor}18`, border: `1px solid ${fitColor}4d` }}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fitColor }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: fitColor }}>{fitTitle}</div>
          <div className="text-xs" style={{ color: fitColor, opacity: 0.8 }}>{fitSub}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {/* FOV */}
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="block text-base font-bold" style={{ color: '#c8b870' }}>{fovH.toFixed(1)}°</span>
          <span className="block text-xs mt-1 font-semibold" style={{ color: fovCat.color }}>{fovCat.label}</span>
          <span className="block text-xs mt-0.5 uppercase tracking-wide" style={{ color: '#4a4050' }}>campo</span>
        </div>
        {/* Luna */}
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="block text-base font-bold" style={{ color: '#c8b870' }}>{Math.round(bodyPx)}px</span>
          <span className="block text-xs mt-1" style={{ color: '#6a6070' }}>{lunaPct}% del frame</span>
          <span className="block text-xs mt-0.5 uppercase tracking-wide" style={{ color: '#4a4050' }}>luna</span>
        </div>
        {/* Aereo vs Luna */}
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="block text-base font-bold" style={{ color: acVsColor }}>{acVsLuna}%</span>
          <span className="block text-xs mt-1" style={{ color: '#6a6070' }}>del disco lunare</span>
          <span className="block text-xs mt-0.5 uppercase tracking-wide" style={{ color: '#4a4050' }}>aereo</span>
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
        <span>{animating ? 'Pausa' : 'Anima il transito'}</span>
      </button>

      {/* Summary card */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {summaryItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: i < summaryItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span className="text-xs" style={{ color: '#6a6070' }}>{item.label}</span>
            <span className="text-sm font-medium" style={{ color: '#d0c8b8' }}>{item.value}</span>
            <button
              onClick={() => onEdit(item.step)}
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(200,184,112,0.1)', color: '#c8b870' }}
            >
              modifica
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4.5 — Commit**

```bash
git add components/simulator/steps/
git commit -m "feat(simulator): add 4 step components"
```

---

## Task 5: FovSimulator wizard shell

**Files:**
- Create: `components/simulator/FovSimulator.tsx`

- [ ] **Step 5.1 — Create wizard shell**

```tsx
// components/simulator/FovSimulator.tsx
'use client'

import { useState } from 'react'
import { StepTarget } from './steps/StepTarget'
import { StepCamera } from './steps/StepCamera'
import { StepFocal }  from './steps/StepFocal'
import { StepPreview } from './steps/StepPreview'
import type { SimulatorState } from '@/lib/simulator/types'

const TOTAL_STEPS = 4

const STEP_TITLES = ['FOV Simulator', 'Camera', 'Focale & Aereo', 'Preview']

const DEFAULT_STATE: SimulatorState = {
  target:     'moon',
  cameraId:   'ff',
  focalMm:    600,
  aircraftId: 'b737',
}

export function FovSimulator() {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<SimulatorState>(DEFAULT_STATE)

  const update = (partial: Partial<SimulatorState>) =>
    setState(s => ({ ...s, ...partial }))

  const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const goBack = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: '#07070f', color: '#d8d0c0' }}
    >
      {/* Nav header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 shrink-0">
        {step > 1 && (
          <button
            onClick={goBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#8a8070' }}
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
          Passo {step} di {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pb-4 shrink-0">
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
          <StepPreview state={state} onEdit={goToStep => setStep(goToStep)} />
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-8 pt-3 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
        <button
          onClick={goNext}
          disabled={step === TOTAL_STEPS}
          className="w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98]"
          style={{
            background: step === TOTAL_STEPS
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #c8b870, #a08840)',
            color: step === TOTAL_STEPS ? '#4a4050' : '#1a1408',
            border: 'none',
          }}
        >
          {step === TOTAL_STEPS ? 'Salva setup' : 'Avanti →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2 — Commit**

```bash
git add components/simulator/FovSimulator.tsx
git commit -m "feat(simulator): add FovSimulator wizard shell"
```

---

## Task 6: Route page

**Files:**
- Create: `app/[locale]/simulator/page.tsx`

- [ ] **Step 6.1 — Create page**

```tsx
// app/[locale]/simulator/page.tsx
import { FovSimulator } from '@/components/simulator/FovSimulator'

export default function SimulatorPage() {
  return <FovSimulator />
}
```

- [ ] **Step 6.2 — Verify route resolves**

Start dev server (`npm run dev`) and navigate to `/it/simulator` or `/en/simulator`.  
Expected: wizard renders at step 1 with Luna / Sole cards.

- [ ] **Step 6.3 — Commit**

```bash
git add app/[locale]/simulator/page.tsx
git commit -m "feat(simulator): add /simulator route"
```

---

## Task 7: Navigation + i18n

**Files:**
- Modify: `components/layout/BottomNav.tsx`
- Modify: `messages/it.json`
- Modify: `messages/en.json`

- [ ] **Step 7.1 — Add i18n nav key**

In `messages/it.json`, add inside `"nav"`:
```json
"simulator": "Simulatore"
```

In `messages/en.json`, add inside `"nav"`:
```json
"simulator": "Simulator"
```

- [ ] **Step 7.2 — Add simulator tab to BottomNav**

In `components/layout/BottomNav.tsx`, update the `tabs` array:

```ts
const tabs = [
  { key: 'monitor'   as const, icon: '◎',  path: (l: string) => `/${l}/monitor` },
  { key: 'simulator' as const, icon: '🔭', path: (l: string) => `/${l}/simulator` },
  { key: 'settings'  as const, icon: '⚙',  path: (l: string) => `/${l}/settings` },
  { key: 'guide'     as const, icon: '📖', path: (l: string) => `/${l}/guide` },
]
```

- [ ] **Step 7.3 — Verify navigation**

Navigate to `/it/monitor` → bottom nav shows 4 tabs including 🔭 Simulatore. Tap it → routes to `/it/simulator`.

- [ ] **Step 7.4 — Commit**

```bash
git add components/layout/BottomNav.tsx messages/it.json messages/en.json
git commit -m "feat(simulator): add nav tab and i18n keys"
```

---

## Task 8: Smoke test and final commit

- [ ] **Step 8.1 — Run full test suite**

```bash
npm run test -- --no-coverage
```

Expected: all existing tests pass + 5 new FOV math tests pass.

- [ ] **Step 8.2 — TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8.3 — Manual smoke test (mobile viewport)**

In browser devtools set viewport to 390×844 (iPhone 14). Walk through:

1. Tap 🌕 Luna → Avanti
2. Tap Full Frame → Avanti
3. Tap 600mm preset, select Boeing 737 → Avanti
4. Verify canvas renders Moon + aircraft
5. Verify 3 stat pills show values
6. Tap "Anima il transito" → aircraft traverses frame
7. Tap "modifica" on Camera → returns to Step 2

- [ ] **Step 8.4 — Final commit**

```bash
git add .
git commit -m "feat: FOV Simulator — step wizard, canvas renderer, nav tab"
git push
```
