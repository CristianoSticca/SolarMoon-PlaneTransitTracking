'use client'

import { useEffect, useRef } from 'react'
import { fovDeg, angularSizeDeg, pixelSpan } from '@/lib/simulator/fov'
import { CAMERAS, AIRCRAFT } from '@/lib/simulator/data'
import type { SimulatorState } from '@/lib/simulator/types'

const CANVAS_W = 700
const CANVAS_H = 467  // 3:2 ratio
const DIST_KM  = 10   // fixed aircraft distance

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

// ─── Drawing ─────────────────────────────────────────────────────────────────

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

  // Stars — deterministic via simple LCG for consistency across renders
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }
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

  // fuselage half-width (perpendicular to flight axis)
  const fw = Math.max(3, spanPx * 0.062)

  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 6

  // ── Main wings (drawn first, fuselage overlaps root) ──────────────────────
  // Nose points RIGHT (+x). Wings sweep back: tips are behind root in -x.
  ;([-1, 1] as number[]).forEach(s => {
    ctx.fillStyle = '#a8a2a2'
    ctx.beginPath()
    ctx.moveTo(lenPx * 0.14,  -fw * s)              // root leading edge
    ctx.lineTo(-lenPx * 0.02, -spanPx * 0.50 * s)   // tip leading edge (swept back)
    ctx.lineTo(-lenPx * 0.16, -spanPx * 0.50 * s)   // tip trailing edge
    ctx.lineTo(-lenPx * 0.16, -fw * s)               // root trailing edge
    ctx.closePath()
    ctx.fill()
  })

  // ── Horizontal stabilizers (at tail) ─────────────────────────────────────
  ;([-1, 1] as number[]).forEach(s => {
    ctx.fillStyle = '#9898a2'
    ctx.beginPath()
    ctx.moveTo(-lenPx * 0.34, -fw * 0.65 * s)
    ctx.lineTo(-lenPx * 0.42, -spanPx * 0.21 * s)
    ctx.lineTo(-lenPx * 0.50, -spanPx * 0.21 * s)
    ctx.lineTo(-lenPx * 0.50, -fw * 0.65 * s)
    ctx.closePath()
    ctx.fill()
  })

  // ── Engine nacelles (one per wing) ────────────────────────────────────────
  ;([-1, 1] as number[]).forEach(s => {
    ctx.fillStyle = '#686070'
    ctx.beginPath()
    ctx.ellipse(lenPx * 0.06, spanPx * 0.30 * s, lenPx * 0.085, fw * 0.50, 0, 0, Math.PI * 2)
    ctx.fill()
    // intake ring highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(lenPx * 0.12, spanPx * 0.30 * s, fw * 0.38, fw * 0.38, 0, 0, Math.PI * 2)
    ctx.stroke()
  })

  // ── Fuselage (nose → right, tail → left) ─────────────────────────────────
  ctx.fillStyle = '#c6bebf'
  ctx.beginPath()
  ctx.moveTo(lenPx * 0.50, 0)                                        // nose tip
  ctx.bezierCurveTo( lenPx * 0.46, -fw,  lenPx * 0.18, -fw, -lenPx * 0.28, -fw * 0.88)
  ctx.bezierCurveTo(-lenPx * 0.43, -fw * 0.68, -lenPx * 0.50, -fw * 0.32, -lenPx * 0.50, 0)
  ctx.bezierCurveTo(-lenPx * 0.50,  fw * 0.32, -lenPx * 0.43,  fw * 0.68, -lenPx * 0.28,  fw * 0.88)
  ctx.bezierCurveTo( lenPx * 0.18,  fw,  lenPx * 0.46,  fw,  lenPx * 0.50, 0)
  ctx.closePath()
  ctx.fill()

  // ── Cockpit windows (tinted, near nose) ───────────────────────────────────
  ctx.fillStyle = 'rgba(160,215,255,0.32)'
  ctx.beginPath()
  ctx.ellipse(lenPx * 0.36, 0, lenPx * 0.07, fw * 0.44, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.restore()
}
