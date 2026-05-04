# SolarMoon — Design Spec
**Data:** 2026-05-04  
**Autore:** Cristiano Sticca  
**Stato:** Approvato — pronto per implementazione

---

## 1. Obiettivo

PWA per fotografi che rileva in near-real-time il transito di aeromobili davanti a Luna e Sole. L'utente apre l'app sul campo, autorizza il GPS, e riceve avvisi quando un aereo sta per transitare nel cono visivo del corpo celeste inquadrato — con anticipo sufficiente per prepararsi e scattare.

---

## 2. Piattaforma & Deploy

| Voce | Scelta |
|---|---|
| Tipo app | PWA (Progressive Web App) — installabile via "Aggiungi alla home" |
| Framework | Next.js 14 App Router (TypeScript) |
| Deploy | Vercel |
| Database & Auth | Supabase (già in uso dall'utente) |
| Lingue | Italiano + Inglese (`next-intl`) |
| Target dispositivi | Mobile-first, browser desktop supportato |

---

## 3. Autenticazione

**Magic Link via Supabase Auth** — nessuna password.

Flusso:
1. L'utente inserisce la sua email
2. Riceve un link via email, ci clicca
3. Viene autenticato e la sessione è persistente sul dispositivo

**Motivazione:** Elimina la barriera della registrazione mantenendo un'identità per il rate limiting. Supabase Auth free tier supporta fino a 50.000 MAU con email transazionali incluse.

---

## 4. Stack Tecnico

### Frontend
- **Next.js 14 App Router** — React Server Components + Client Components
- **TypeScript** — type safety su tutto il progetto
- **next-intl** — i18n italiano/inglese
- **@ducanh2912/next-pwa** — Service Worker, manifest PWA, push notifications
- **suncalc** — calcolo posizione Sole e Luna lato client (matematica pura, zero API esterne)
- **Tailwind CSS** — styling, glass morphism via `backdrop-filter`

### Backend (Vercel Serverless Functions)
- `/api/flights` — proxy verso provider dati di volo, con fallback chain
- `/api/push/subscribe` — salva subscription Web Push su Supabase
- `/api/push/send` — endpoint per invio push server-side (fuori scope v1 — sarà usato quando si implementerà il monitoraggio 24/7 senza app aperta)

### Database (Supabase)
```sql
-- Preferenze utente
user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  language text DEFAULT 'it',
  search_radius_km int DEFAULT 25,
  angular_margin_deg float DEFAULT 0.5,
  notification_lead_min int DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Subscriptions push notifications
push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  subscription jsonb NOT NULL,  -- Web Push subscription object
  device_label text,
  created_at timestamptz DEFAULT now()
)
```

### Rate Limiting
Vercel Edge Middleware: max **6 chiamate/minuto** per `user_id` autenticato verso `/api/flights`. Semplice, senza servizi aggiuntivi.

---

## 5. Dati di Volo — Provider con Fallback

Catena di fallback automatica, trasparente all'utente:

| Priorità | Provider | Auth | Note |
|---|---|---|---|
| 1 | **ADSB-One** (`api.adsb.one`) | No | Free, no key, REST, copertura globale |
| 2 | **Airplanes.live** | No | Free, no key, community network |
| 3 | **OpenSky Network** | Opzionale | Free (anonimo: 400 req/giorno, con account: 4000) |

L'API route normalizza la risposta dei tre provider in un formato comune. Se un provider fallisce o va in timeout (2s), si passa al successivo.

**Query geografica:** `lat / lon / raggio_km` → restituisce lista aerei con posizione, quota, heading, velocità, identificativo.

---

## 6. Calcolo Transiti (lato client)

Per ogni aereo ricevuto dall'API:

1. **Posizione celeste** — `suncalc` calcola azimuth ed elevazione di Luna e Sole per le coordinate GPS dell'utente in quel momento
2. **Proiezione traiettoria** — con heading e velocità dell'aereo si proietta la posizione nei prossimi 10 minuti (step da 5 secondi)
3. **Separazione angolare** — per ogni punto proiettato si calcola la distanza angolare dall'aereo al corpo celeste
4. **Soglia** — se `separazione < margine_angolare` → transito rilevato, countdown al momento di contatto

**Polling interval:** ogni 20 secondi.

---

## 7. Schermate

### ① Login
- Logo + nome app (SolarMoon)
- Campo email + pulsante "Invia Magic Link"
- Testo: "Nessuna password richiesta"
- Selezione lingua IT/EN

### ② Onboarding (solo primo accesso)
Tre step sequenziali, ognuno saltabile:
1. **GPS** — richiesta permesso posizione
2. **Notifiche Push** — richiesta permesso notifiche + installazione Service Worker
3. **Installa App** — prompt "Aggiungi alla home screen" (A2HS)

### ③ Monitoraggio (schermata principale)
Layout con toggle in cima:

**Vista Radar:**
- Bussola circolare centrata sull'utente
- Luna e Sole come punti fissi con icona e glow
- Aerei come punti mobili — verde se in rotta di transito, grigio altrimenti
- Etichette N/S/E/W
- Alert countdown fisso in basso: `✈ A320 → 🌙 LUNA | 1:47`

**Vista Lista:**
- Lista scrollabile dei transiti rilevati ordinati per imminenza
- Per ogni voce: identificativo aereo, corpo celeste, countdown, scarto angolare
- Primo elemento evidenziato se imminente

**Elementi sempre visibili:**
- Toggle Radar/Lista in cima
- Alert countdown in basso (se c'è un transito imminente)
- Indicatore `⬤ live` + provider attivo
- Icona `⚙` impostazioni e `?` guida in alto a destra

**Modalità Schermo Sempre Acceso:** toggle attivabile via Wake Lock API — impedisce allo schermo di spegnersi durante il monitoraggio.

### ④ Impostazioni
Preferenze salvate su Supabase (sincronizzate tra dispositivi):
- **Lingua** — IT / EN
- **Raggio di ricerca** — 10 / 25 / 50 km (default: 25)
- **Margine angolare** — ±0.2° / ±0.5° / ±1.5° (default: ±0.5°)
- **Anticipo notifica** — 3 min / 5 min (default: 3)
- **Provider dati** — Auto (fallback chain) — sola lettura, informativo

### ⑤ Guida / Come Funziona
Sezione accessibile dall'icona `?` nella navbar. Contiene spiegazioni visive con diagrammi animati per:
- Come leggere il radar (cosa sono i cerchi, i punti, i colori)
- Cos'è il raggio di ricerca e come sceglierlo
- Cos'è il margine angolare e come influisce sugli avvisi
- Come abilitare notifiche push e installare la PWA
- Crediti provider dati

---

## 8. Notifiche Push

**In-app (app aperta/foreground):**
- Alert visivo nella barra in basso con countdown animato
- Vibrazione (Vibration API) a 30 secondi dal transito
- Suono opzionale (Audio API)

**Background (app minimizzata/schermo spento):**
- Service Worker rileva il transito tramite polling ogni 20 secondi
- Mostra notifica push nativa: `✈ Airbus A320 → 🌙 Luna tra 2 minuti | Scarto ±0.3° · Az 247°`
- Tap sulla notifica → apre l'app sulla schermata radar

**Requisiti dispositivo:**
- Android: funziona sia installata che da browser
- iOS 16.4+: richiede installazione a home screen (Apple Web Push)

---

## 9. Session Log

Nessuno storico persistente in v1. Durante la sessione attiva viene mantenuto in `localStorage` un log degli ultimi transiti rilevati (max 20 voci), svuotato alla chiusura dell'app. Visualizzato nella Vista Lista come sezione "Recenti in questa sessione".

---

## 10. Grafica & Design System

**Stile:** Glass Morphism su sfondo scuro

- **Sfondo:** gradient `#0f0c29 → #302b63 → #24243e`
- **Card/Panel:** `background: rgba(255,255,255,0.08)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(255,255,255,0.15)`
- **Accento primario:** `#a78bfa` (violet-400)
- **Transito attivo:** `#4ade80` (green-400) con glow
- **Luna:** `#ffd700` con glow ambrato
- **Sole:** `#fbbf24` con glow giallo
- **Font:** Inter (sans-serif), monospace per countdown e coordinate
- **Pill/badge:** border-radius pieno, stile minimalista

---

## 11. Fuori Scope (v1)

- Storico transiti persistente (v2, semplice aggiunta con Supabase)
- Monitoraggio server-side 24/7 senza app aperta
- Filtro per tipo aeromobile o compagnia aerea
- Condivisione social della cattura
- Previsioni basate su rotte storiche
- Supporto a corpi celesti oltre Luna e Sole (pianeti, ISS)

---

## 12. Open Questions (risolte)

| Domanda | Decisione |
|---|---|
| Auth o no auth? | Magic Link — bassa friction, protegge le API |
| Storico? | Solo session log in localStorage, no DB |
| Provider dati volo | Catena fallback: ADSB-One → Airplanes.live → OpenSky |
| Push notifications in v1? | Sì — Service Worker lato client |
| Calcolo astronomico | suncalc (client-side, nessuna API esterna) |
| Rate limiting | Vercel Edge Middleware, 6 req/min per utente |
