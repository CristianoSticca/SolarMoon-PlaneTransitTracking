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
  ;([-1, 1] as number[]).forEach(sy => {
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
  ;[0.18, 0.30].forEach(ef => {
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
