# Visual Reskin (Option B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la palette viola con navy+gold, aggiungere sfondo stellato e bottom navigation a 3 tab, senza toccare alcuna funzionalità esistente.

**Architecture:** Tre nuovi componenti condivisi (`StarBackground`, `BottomNav`, `AppHeader`) inseriti nel layout locale; aggiornamento CSS/JSX pagina per pagina mantenendo tutta la logica invariata.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, TypeScript, next-intl

---

## File map

| Azione | File |
|--------|------|
| Crea | `components/layout/StarBackground.tsx` |
| Crea | `components/layout/BottomNav.tsx` |
| Crea | `components/layout/AppHeader.tsx` |
| Modifica | `app/[locale]/layout.tsx` |
| Modifica | `app/[locale]/login/page.tsx` |
| Modifica | `app/[locale]/monitor/page.tsx` |
| Modifica | `components/monitor/MonitorToggle.tsx` |
| Modifica | `components/monitor/TransitAlert.tsx` |
| Modifica | `components/settings/SettingsForm.tsx` |
| Modifica | `app/[locale]/guide/page.tsx` |
| Modifica | `components/guide/GuideContent.tsx` |
| Modifica | `components/onboarding/OnboardingSteps.tsx` |

**Palette di riferimento** (usata in ogni task):
```
bg-base:      #060e1a   (background pagine)
bg-card:      #0a1525   (background card)
border:       rgba(255,255,255,0.07)
gold:         #e8c848   (accento primario, valori, active)
gold-dim:     rgba(232,200,72,0.12)  (tab/badge active bg)
gold-border:  rgba(232,200,72,0.25) (tab/badge active border)
muted:        #8892a4   (label, testo secondario)
text:         #e8eaf0   (testo primario)
danger-bg:    rgba(239,68,68,0.08)
danger-text:  #f87171
```

---

## Task 1: StarBackground component

**Files:**
- Crea: `components/layout/StarBackground.tsx`

- [ ] **Crea il file**

```tsx
'use client'

import { useEffect, useRef } from 'react'

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const r = Math.random() < 0.12 ? 1.2 : 0.6
        const alpha = 0.2 + Math.random() * 0.5
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
```

- [ ] **Commit**

```bash
git add components/layout/StarBackground.tsx
git commit -m "feat: add StarBackground canvas component"
```

---

## Task 2: BottomNav component

**Files:**
- Crea: `components/layout/BottomNav.tsx`

- [ ] **Crea il file**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  locale: string
}

const tabs = [
  { key: 'monitor', label: 'Monitor', icon: '◎', path: (l: string) => `/${l}/monitor` },
  { key: 'settings', label: 'Settings', icon: '⚙', path: (l: string) => `/${l}/settings` },
  { key: 'guide', label: 'Guida', icon: '📖', path: (l: string) => `/${l}/guide` },
]

export function BottomNav({ locale }: Props) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex"
      style={{
        background: '#060e1a',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(tab => {
        const href = tab.path(locale)
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={tab.key}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-center"
            style={{ color: active ? '#e8c848' : '#8892a4', textDecoration: 'none' }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Commit**

```bash
git add components/layout/BottomNav.tsx
git commit -m "feat: add BottomNav component (Monitor/Settings/Guida)"
```

---

## Task 3: AppHeader component

**Files:**
- Crea: `components/layout/AppHeader.tsx`

- [ ] **Crea il file**

```tsx
interface Props {
  pageLabel: string
  right?: React.ReactNode
}

export function AppHeader({ pageLabel, right }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 pt-4 pb-2"
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" fill="none" stroke="#e8c848" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3" fill="#e8c848" />
        </svg>
        <span style={{
          fontSize: 12,
          letterSpacing: '0.2em',
          fontWeight: 600,
          color: '#e8eaf0',
          textTransform: 'uppercase',
        }}>
          SolarMoon
        </span>
      </div>

      {/* Page label + optional right slot */}
      <div className="flex items-center gap-3">
        {right}
        <span style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          color: '#8892a4',
          textTransform: 'uppercase',
        }}>
          {pageLabel}
        </span>
      </div>
    </header>
  )
}
```

- [ ] **Commit**

```bash
git add components/layout/AppHeader.tsx
git commit -m "feat: add AppHeader component with gold ring logo"
```

---

## Task 4: Aggiorna il layout locale

**Files:**
- Modifica: `app/[locale]/layout.tsx`

- [ ] **Sostituisci il file**

```tsx
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StarBackground } from '@/components/layout/StarBackground'
import { BottomNav } from '@/components/layout/BottomNav'

const locales = ['it', 'en']

export const metadata: Metadata = {
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#060e1a',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body style={{ background: '#060e1a', color: '#e8eaf0', minHeight: '100dvh' }}>
        <NextIntlClientProvider messages={messages}>
          <StarBackground />
          {/* padding-bottom lascia spazio alla bottom nav (56px) + safe area */}
          <div style={{ position: 'relative', zIndex: 1, paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
            {children}
          </div>
          <BottomNav locale={locale} />
        </NextIntlClientProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__a2hsEvent = e;
          });
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.error('SW registration failed:', err);
              });
            });
          }
        ` }} />
      </body>
    </html>
  )
}
```

- [ ] **Verifica visivamente in browser** — apri qualsiasi pagina: deve avere sfondo navy scuro, stelle, bottom nav in fondo.

- [ ] **Commit**

```bash
git add "app/[locale]/layout.tsx"
git commit -m "feat: add StarBackground and BottomNav to locale layout"
```

---

## Task 5: Reskin login page

**Files:**
- Modifica: `app/[locale]/login/page.tsx`

- [ ] **Sostituisci solo il JSX del return** (logica invariata). Il componente `LoginPage` diventa:

```tsx
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo centrato */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#e8c848" strokeWidth="2" />
            <circle cx="18" cy="18" r="5" fill="#e8c848" />
          </svg>
          <span style={{ fontSize: 14, letterSpacing: '0.22em', fontWeight: 600, color: '#e8eaf0', textTransform: 'uppercase' }}>
            {tApp('name')}
          </span>
          <span style={{ fontSize: 11, color: '#8892a4' }}>{tApp('tagline')}</span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {status === 'sent' ? (
            <p className="text-center" style={{ color: '#4ade80' }}>{t('sent')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e8eaf0',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(232,200,72,0.15)',
                  border: '1px solid rgba(232,200,72,0.4)',
                  color: '#e8c848',
                }}
              >
                {status === 'loading' ? '...' : t('submit')}
              </button>
              {status === 'error' && (
                <p className="text-center text-xs" style={{ color: '#f87171' }}>{t('error')}</p>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-xs" style={{ color: '#8892a4' }}>{t('hint')}</p>

          <div className="mt-4 flex justify-center gap-2">
            {['it', 'en'].map(l => (
              <a
                key={l}
                href={`/${l}/login`}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={l === locale
                  ? { background: 'rgba(232,200,72,0.15)', border: '1px solid #e8c848', color: '#e8c848' }
                  : { color: '#8892a4' }
                }
              >
                {l.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
```

- [ ] **Commit**

```bash
git add "app/[locale]/login/page.tsx"
git commit -m "feat: reskin login page — navy+gold palette"
```

---

## Task 6: Reskin monitor page — header e view tabs

**Files:**
- Modifica: `app/[locale]/monitor/page.tsx`

La pagina monitor è lunga — aggiorniamo in due sotto-task (6 e 7).

- [ ] **Aggiungi import AppHeader** in cima agli import esistenti:

```tsx
import { AppHeader } from '@/components/layout/AppHeader'
```

- [ ] **Sostituisci il return JSX** — sezione header + view tabs + coordinate. Trova il blocco che inizia con `<div className="flex min-h-screen...">` e sostituisci tutto il wrapper esterno e l'header con:

```tsx
  return (
    <div className="flex flex-col min-h-screen" style={{ color: '#e8eaf0' }}>
      <AppHeader
        pageLabel="Monitor"
        right={
          geo.status === 'granted' ? (
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8892a4', letterSpacing: '0.04em' }}>
              {geo.lat.toFixed(4)}° N · {geo.lon.toFixed(4)}° E
            </span>
          ) : undefined
        }
      />

      {/* Badge ADS-B */}
      <div className="px-4 pb-2" style={{ position: 'relative', zIndex: 1 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'rgba(232,200,72,0.1)', border: '1px solid rgba(232,200,72,0.25)',
          color: '#e8c848', fontSize: 9, padding: '3px 10px',
          borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          ⭐ ADS-B LIVE
        </span>
      </div>

      {/* View tabs */}
      <div className="px-4 pb-3" style={{ position: 'relative', zIndex: 1 }}>
        <div
          className="flex gap-1 rounded-xl p-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {(['radar', 'list', 'map', 'ar'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 rounded-lg py-1.5 text-xs transition-colors"
              style={view === v
                ? { background: 'rgba(232,200,72,0.12)', color: '#e8c848', border: '1px solid rgba(232,200,72,0.25)', letterSpacing: '0.05em', textTransform: 'uppercase' }
                : { color: '#8892a4', border: '1px solid transparent', letterSpacing: '0.05em', textTransform: 'uppercase' }
              }
            >
              {v === 'radar' ? t('tabs.radar') : v === 'list' ? t('tabs.list') : v === 'map' ? t('tabs.map') : 'AR'}
            </button>
          ))}
        </div>
      </div>

      {/* ... il resto del contenuto (TransitAlert, view, status bar) segue */}
```

- [ ] **Aggiorna la status bar** in fondo al JSX (prima della chiusura del div esterno). Trova la sezione con il link a Settings/Guide e sostituisci con:

```tsx
      {/* Status bar */}
      <div
        className="px-4 py-2 flex justify-between items-center"
        style={{ position: 'relative', zIndex: 1, fontSize: 9, color: '#8892a4', letterSpacing: '0.06em', fontFamily: 'monospace' }}
      >
        <span>
          <span style={{ display: 'inline-block', width: 5, height: 5, background: '#4ade80', borderRadius: '50%', marginRight: 4, verticalAlign: 'middle' }} />
          ADS-B FEED
        </span>
        {flightData && (
          <span>{flightData.aircraft?.length ?? 0} contacts · upd 3s</span>
        )}
      </div>
    </div>
  )
```

- [ ] **Rimuovi** l'import `Link` e i link a Settings/Guide (ora sostituiti dalla bottom nav).

- [ ] **Commit**

```bash
git add "app/[locale]/monitor/page.tsx"
git commit -m "feat: reskin monitor page header, tabs, status bar"
```

---

## Task 7: Reskin monitor — TransitAlert e MonitorToggle

**Files:**
- Modifica: `components/monitor/TransitAlert.tsx`
- Modifica: `components/monitor/MonitorToggle.tsx`

- [ ] **Leggi `components/monitor/TransitAlert.tsx`** per capire la struttura attuale del JSX.

- [ ] **Aggiorna i colori in TransitAlert** — sostituisci ogni occorrenza di classi viola con equivalenti gold:
  - `bg-violet-*` → `style={{ background: 'rgba(232,200,72,0.12)' }}`
  - `border-violet-*` → `style={{ border: '1px solid rgba(232,200,72,0.3)' }}`
  - `text-violet-*` → `style={{ color: '#e8c848' }}`
  - `bg-white/8`, `bg-white/10` → `style={{ background: 'rgba(255,255,255,0.04)' }}`
  - `border-white/15` → `style={{ border: '1px solid rgba(255,255,255,0.07)' }}`
  - `text-white/70`, `text-white/50` → `style={{ color: '#8892a4' }}`
  - Valori numerici (azimut, separazione, countdown) → aggiungi `fontFamily: 'monospace'`

- [ ] **Leggi `components/monitor/MonitorToggle.tsx`** per capire la struttura.

- [ ] **Aggiorna i colori in MonitorToggle** con la stessa logica:
  - Bottoni active: gold border + gold text + gold-dim background
  - Bottoni inattivi: `color: '#8892a4'`

- [ ] **Commit**

```bash
git add components/monitor/TransitAlert.tsx components/monitor/MonitorToggle.tsx
git commit -m "feat: reskin TransitAlert and MonitorToggle — gold palette"
```

---

## Task 8: Reskin settings

**Files:**
- Modifica: `components/settings/SettingsForm.tsx`

- [ ] **Leggi il file** per capire la struttura completa.

- [ ] **Aggiorna colori e stile** in SettingsForm:
  - Wrapper card: `background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)'`
  - Section headers: `fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8892a4'`
  - Valori slider/input: `color: '#e8c848', fontFamily: 'monospace'`
  - Toggle attivo: `background: 'rgba(232,200,72,0.2)', border: '1px solid #e8c848'` con pallino `background: '#e8c848'`
  - Toggle inattivo: `background: 'rgba(255,255,255,0.1)'`
  - Slider accent: `accentColor: '#e8c848'` (CSS property)
  - Bottone Sign Out: `background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171'`
  - Rimuovi classi `backdrop-blur-*`, `bg-white/*`

- [ ] **Aggiungi AppHeader** in `app/[locale]/settings/page.tsx` se la pagina ha un proprio header, oppure verifica che sia già gestito da SettingsForm.

- [ ] **Commit**

```bash
git add components/settings/SettingsForm.tsx "app/[locale]/settings/page.tsx"
git commit -m "feat: reskin settings — gold palette, monospace values"
```

---

## Task 9: Reskin guide

**Files:**
- Modifica: `app/[locale]/guide/page.tsx`
- Modifica: `components/guide/GuideContent.tsx`

- [ ] **Aggiorna `app/[locale]/guide/page.tsx`** — aggiungi AppHeader, rimuovi link di navigazione manuale:

```tsx
import { AppHeader } from '@/components/layout/AppHeader'

// Nel return, sostituisci l'header esistente con:
<AppHeader pageLabel="Guida" />
```

- [ ] **Aggiorna `components/guide/GuideContent.tsx`** — stessi criteri di colore:
  - Headings: `color: '#e8eaf0'`
  - Testo corpo: `color: '#8892a4'`
  - Highlight/accent: `color: '#e8c848'`
  - Card/sezioni: `background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)'`
  - Rimuovi `backdrop-blur-*`, `bg-white/*`

- [ ] **Commit**

```bash
git add "app/[locale]/guide/page.tsx" components/guide/GuideContent.tsx
git commit -m "feat: reskin guide page — navy+gold"
```

---

## Task 10: Reskin onboarding

**Files:**
- Modifica: `components/onboarding/OnboardingSteps.tsx`

- [ ] **Leggi il file** per capire la struttura.

- [ ] **Aggiorna colori** con la stessa logica dei task precedenti:
  - Bottoni primari: gold border + gold text + gold-dim background
  - Cards: `rgba(255,255,255,0.04)` + bordo sottile
  - Testo secondario: `#8892a4`
  - Rimuovi `bg-violet-*`, `backdrop-blur-*`, `bg-white/*`

- [ ] **Commit**

```bash
git add components/onboarding/OnboardingSteps.tsx
git commit -m "feat: reskin onboarding — gold palette"
```

---

## Task 11: Pulizia e verifica finale

- [ ] **Cerca classi viola residue** nel codebase:

```bash
grep -rn "violet\|purple\|bg-white/\|backdrop-blur" \
  app/\[locale\] components/monitor components/settings components/guide components/onboarding \
  --include="*.tsx" | grep -v node_modules
```

- [ ] **Correggi** eventuali occorrenze rimaste.

- [ ] **Aggiorna themeColor** nel manifest — già fatto nel layout (task 4), verifica anche `public/manifest.json`:

```json
"theme_color": "#060e1a",
"background_color": "#060e1a"
```

- [ ] **Test su iPhone** — apri il sito in Safari su iPhone, verifica:
  - Stelle visibili
  - Bottom nav presente e funzionante
  - Colori gold al posto del viola
  - Nessun crash (nessun `ReferenceError`)

- [ ] **Commit finale**

```bash
git add public/manifest.json
git commit -m "chore: update manifest theme/background color to navy"
git push
```
