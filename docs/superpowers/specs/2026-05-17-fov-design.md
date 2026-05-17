# FOV Simulator — Design

**Status:** Approved  
**Prototype:** Prototype C (wizard step-by-step, mobile-first)  
**Date:** 2026-05-17

---

## Goal

A standalone 4-step wizard at `/[locale]/simulator` that lets astrophotographers preview their final shot before a transit:

- how large the Moon/Sun appears in the frame
- how large the aircraft appears relative to the lunar/solar disk
- whether the aircraft fits in the frame
- an animated preview of the transit passage

---

## UX Flow

### 4-step wizard (Prototype C pattern)

```
Step 1 → Step 2 → Step 3 → Step 4
Target   Camera   Focale    Preview
                  + Aereo
```

**Step 1 — Target**  
Two tap-to-select cards: Luna (0.50°) / Sole (0.53°). Pre-selected: Luna.

**Step 2 — Camera**  
Four tap-to-select cards with sensor dimensions:
- Full Frame (36×24mm, ×1.0)
- APS-C Canon (22.3×14.9mm, ×1.6)
- APS-C Sony/Nikon (23.5×15.6mm, ×1.5)
- Micro 4/3 (17.3×13.0mm, ×2.0)

**Step 3 — Focale & Aereo**  
- 6 focal preset buttons: 200 / 400 / 600 / 800 / 1000 / 1200mm. Default: 600mm.
- Custom slider 100–1200mm (step 25) — synced with preset buttons.
- Aircraft selection cards (single-select):
  - Boeing 737-800 (wingspan 35.8m / length 39.5m)
  - Airbus A320 (wingspan 35.8m / length 37.6m)
  - Boeing 787 Dreamliner (wingspan 60.1m / length 57m)
  - Airbus A380 (wingspan 79.75m / length 73m)
  - CRJ-200 Regional (wingspan 21m / length 26m)

**Step 4 — Preview**  
- Canvas frame (aspect ratio 3:2, matches camera sensor proportions)
- Fit badge (green / amber / red)
- 3 stat pills (see Stats section)
- "Anima il transito" button → aircraft traverses the frame
- Summary card with "modifica" links back to each step

**Navigation:**  
Progress dots (4 steps) + "‹ back" button + "Avanti →" primary CTA.  
Step 4 CTA changes to "Salva setup" (placeholder for future save feature).

---

## Data Models

```ts
// lib/simulator/data.ts

type Camera = {
  id: 'ff' | 'apsc_c' | 'apsc_s' | 'm43'
  name: string
  sensorW: number   // mm
  sensorH: number   // mm
  cropFactor: number
}

type Aircraft = {
  id: string
  name: string
  wingspan: number  // meters
  length: number    // meters
}
```

---

## FOV Math

```ts
// lib/simulator/fov.ts

/** Horizontal or vertical FOV in degrees */
fovDeg(sensorMm: number, focalMm: number): number
  = 2 * toDeg(atan(sensorMm / (2 * focalMm)))

/** Angular size of an object in degrees */
angularSizeDeg(sizeMeters: number, distKm: number): number
  = 2 * toDeg(atan(sizeMeters / (2 * distKm * 1000)))

/** Pixel span of an angular object on a canvas of width W */
pixelSpan(angularDeg: number, fovHDeg: number, canvasW: number): number
  = canvasW * (angularDeg / fovHDeg)
```

Default aircraft distance: **10 km** (realistic transit range). Not user-adjustable in v1 — keeps the UI simple.

---

## Canvas Rendering Pipeline

Rendered imperatively on `<canvas>` via `useRef` + `useEffect`. No React re-renders inside draw loop.

1. Clear + radial gradient background (dark navy → near-black)
2. Random star field (400 dots, opacity 0.01–0.05, seeded per render for consistency)
3. Rule-of-thirds grid (rgba white, 4% opacity)
4. Frame border (rgba white, 15% opacity, 2px)
5. Moon disc (radial gradient #f0e8c8→#a07040 + 4 crater circles) **or** Sun disc (radial gradient #fffce0→#ff7000 + corona glow)
6. Dashed trajectory line (horizontal through center, 6% opacity)
7. Aircraft silhouette (fuselage bezier + swept wings + tail + 4 engine pods) — silver-grey tones
8. HUD text bottom-left (camera name + focal) and bottom-right (FOV value)

Canvas internal resolution: **700×467px** (3:2 ratio). CSS width: 100% of parent.

---

## Stats (Step 4)

Three stat pills displayed under the canvas:

| Pill | Value | Sub-label | Notes |
|------|-------|-----------|-------|
| **Campo inquadrato** | `fovH.toFixed(1)°` | Category label | Astro (<2°) / Super-tele (<4°) / Tele (<8°) / Normale (<20°) / Wide (≥20°) — colour-coded |
| **Luna nel frame** | `Math.round(bodyPx)px` | `X% del frame` | bodyPx = pixelSpan(0.5°, fovH, 700) |
| **Aereo vs Luna** | `X%` | `del disco lunare` | acSpanPx / bodyPx × 100 — green ≥30%, amber 15–30%, red <15% |

---

## Fit Badge

Shown between canvas and stats:

| Condition | Class | Label |
|-----------|-------|-------|
| `acSpanPx ≤ W × 0.85` | green | "✓ Aereo nel frame" + "occupa X% del frame" |
| `acSpanPx ≤ W × 1.0` | amber | "⚠ Margine ridotto" + "X% del frame" |
| `acSpanPx > W × 1.0` | red | "✗ Fuori dal frame" + "riduci la focale" |

---

## Component Architecture

```
app/[locale]/simulator/
  page.tsx                   ← Server component, metadata, renders <FovSimulator />

components/simulator/
  FovSimulator.tsx            ← Wizard: step state, navigation, layout shell
  FovCanvas.tsx               ← Canvas renderer, receives props, draws imperatively
  steps/
    StepTarget.tsx            ← Step 1
    StepCamera.tsx            ← Step 2
    StepFocal.tsx             ← Step 3 (focal + aircraft)
    StepPreview.tsx           ← Step 4 (canvas + stats + animate + summary)

lib/simulator/
  fov.ts                      ← Pure math: fovDeg, angularSizeDeg, pixelSpan
  data.ts                     ← CAMERAS and AIRCRAFT constant arrays
  types.ts                    ← Camera, Aircraft, SimulatorState types

lib/simulator/__tests__/
  fov.test.ts                 ← Unit tests for math functions
```

---

## Navigation

Add `simulator` tab to `BottomNav` between Monitor and Settings:

```ts
{ key: 'simulator', icon: '🔭', path: (l) => `/${l}/simulator` }
```

Add i18n key `simulator: "Simulatore"` (IT) / `"Simulator"` (EN) in `nav` namespace.

---

## i18n

New `simulator` namespace in both message files. Covers: step titles, card labels, button labels, stat labels, fit badge messages, summary labels.

---

## Out of Scope (v1)

- User-adjustable aircraft distance (fixed at 10 km)
- Save/load setup
- Share preview image export
- AR alignment integration
- Connection to live transit data
- Teleconverter multiplier
