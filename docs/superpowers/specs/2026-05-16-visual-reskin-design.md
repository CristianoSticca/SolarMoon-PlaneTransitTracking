# SolarMoon — Visual Reskin (Option B)

**Date:** 2026-05-16  
**Scope:** Reskin grafico parziale — palette, tipografia, stelle, bottom nav. Nessuna modifica funzionale.

---

## Obiettivo

Portare SolarMoon a un'estetica navy+gold ispirata al riferimento Lunair, mantenendo intatte tutte le funzionalità esistenti (4 view, radar, lista, mappa, AR, push notifications, geolocalizzazione, preferenze, guida).

---

## Palette

| Token | Valore | Uso |
|-------|--------|-----|
| `bg-base` | `#060e1a` | Background pagine |
| `bg-card` | `#0a1525` | Card e sezioni |
| `border-subtle` | `rgba(255,255,255,0.07)` | Bordi card |
| `gold` | `#e8c848` | Accento primario (valori, active states, icone) |
| `gold-dim` | `rgba(232,200,72,0.12)` | Background badge/tab attivo |
| `gold-border` | `rgba(232,200,72,0.25)` | Bordo badge/tab attivo |
| `muted` | `#8892a4` | Label, testo secondario |
| `text` | `#e8eaf0` | Testo primario |
| `danger` | `rgba(239,68,68,0.08)` + `#f87171` | Sign out / errori |

Sostituisce completamente la palette viola (`#0f0c29`, `#302b63`, `#7c3aed`, `#a78bfa`).

---

## Tipografia

- **Valori numerici** (azimut, separazione, coordinate, countdown): `font-family: monospace` (`SF Mono` su iOS, `Fira Mono`/`Consolas` altrove)
- **Label e titoli sezione**: `text-transform: uppercase`, `letter-spacing: 0.08–0.12em`, `font-size: 9–11px`
- **Testo corpo**: `-apple-system` invariato

---

## Sfondo stellato

- Canvas `<canvas>` assoluto, `pointer-events: none`, `z-index: 0`, copre l'intera pagina
- ~60 stelle per pagina: raggio `0.6px` (85%) e `1.2px` (15%), `opacity` tra `0.2` e `0.7`
- Colore bianco puro — nessuna animazione (performance mobile)
- Generato una volta al mount, non rigenerato
- Implementato in un componente `<StarBackground />` riusabile, inserito nel layout locale `app/[locale]/layout.tsx`

---

## Logo

- Anello SVG gold `20px` + punto centrale `6px` + testo `SOLARMOON` uppercase `letter-spacing: 0.2em`
- Sostituisce l'emoji 🌙 nell'header
- Il logo definitivo può essere affinato in seguito senza impatto strutturale

---

## Bottom Navigation

Nuovo componente `<BottomNav />` con 3 tab:

| Tab | Icona | Route |
|-----|-------|-------|
| Monitor | `◎` | `/[locale]/monitor` |
| Settings | `⚙` | `/[locale]/settings` |
| Guida | `📖` | `/[locale]/guide` |

- Posizione: `fixed bottom-0`, full width, `z-index: 50`
- Background: `#060e1a` opaco con `border-top: 1px solid rgba(255,255,255,0.07)`
- Tab attivo: colore `#e8c848`, tab inattivo: `#8892a4`
- Rilevamento tab attivo via `usePathname()`
- Inserito in `app/[locale]/layout.tsx` così appare su tutte le pagine locale
- Il body delle pagine riceve `padding-bottom` sufficiente per non essere coperto dalla nav

---

## Card e componenti

- **Background**: `rgba(255,255,255,0.04)` — solid, no glassmorphism (`backdrop-blur` rimosso)
- **Border**: `1px solid rgba(255,255,255,0.07)`
- **Border-radius**: invariato (`rounded-2xl` = 16px)
- **View tabs interni al monitor** (Radar/Lista/Mappa/AR): stile aggiornato con gold come colore active, background `rgba(232,200,72,0.12)`
- **Toggle/switch**: gold invece di violet
- **Button primario**: `background: rgba(232,200,72,0.15)`, `border: 1px solid #e8c848`, `color: #e8c848` — no più `bg-violet-600`

---

## Pagine in scope

Tutte le pagine sotto `app/[locale]/`:
- `monitor/page.tsx`
- `settings/page.tsx` (incluso `components/settings/SettingsForm.tsx`)
- `guide/page.tsx` + `components/guide/`
- `login/page.tsx`
- `onboarding/page.tsx`
- `page.tsx` (home/redirect)

Layout `app/[locale]/layout.tsx`: aggiunge `<StarBackground />` e `<BottomNav />`.

---

## Fuori scope

- Struttura delle 4 view (Radar, Lista, Mappa, AR): invariata
- Logica funzionale di qualsiasi hook o componente
- Componenti interni al radar (SVG, calcoli)
- MapView e ARView: solo colori CSS se necessario, no refactor
- `app/layout.tsx` (root layout)

---

## Nuovi componenti da creare

1. `components/layout/StarBackground.tsx` — canvas stelle
2. `components/layout/BottomNav.tsx` — navigazione bottom
3. `components/layout/AppHeader.tsx` — header con logo + page label (riusabile)

---

## Strategia di implementazione

Aggiornare un file alla volta, partendo dai componenti condivisi (layout) poi procedere pagina per pagina. Nessun feature flag necessario — è puro CSS/JSX.
