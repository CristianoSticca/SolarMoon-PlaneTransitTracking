# SolarMoon — Aircraft Transit Tracker

**Live:** [transitsky.cristianosticca.com](https://transitsky.cristianosticca.com)

A progressive web app for astrophotographers to detect aircraft transits across the Moon and Sun in near-real-time. Open the app, share your GPS location, and get alerted when a plane is about to cross your celestial target — with enough lead time to prepare and shoot.

---

## Features

- **Real-time radar** — compass view with Moon (crescent) and Sun (with rays) as fixed points; FR24-style aircraft silhouettes rotated by heading
- **List view** — sorted transit countdowns + nearby aircraft with projected minimum separation
- **Map view** — geographic Leaflet map with FR24-style aircraft icons; panning/zooming triggers new API queries for the visible area (up to 450 km radius); click any aircraft for full details
- **AR camera view** — live camera feed with aircraft, Moon and Sun overlaid at their real sky positions using GPS + compass + gyroscope
- **Flight details** — origin, destination, airline name and status via AirLabs API (on demand, per click)
- **Transit detection** — projects each aircraft's trajectory over 10 minutes, calculates angular separation from Moon/Sun, alerts at first entry into transit zone
- **Push notifications** — alerts even when the app is in background (requires PWA installation)
- **2-provider fallback** — Airplanes.live → OpenSky Network, automatic failover
- **API health check** — built-in panel in Settings to verify provider and AirLabs connectivity
- **Configurable parameters** — search radius (10–50 km), angular margin (±0.2° / ±0.5° / ±1.5°), notification lead time
- **Screen wake lock** — keeps display on while monitoring
- **Bilingual** — Italian and English (switch in settings)
- **PWA** — installable on Android and iOS (16.4+) via "Add to Home Screen"

---

## Views

| View | Description |
|---|---|
| 📡 Radar | SVG compass centered on you. Moon/Sun as distinct icons (crescent/rays). Aircraft as FR24-style silhouettes rotated by heading. Green = transiting. |
| ☰ Lista | Sorted list of transit countdowns (green) + nearby aircraft with projected min separation (grey). |
| 🗺️ Mappa | Leaflet map, OSM tiles. Yellow aircraft icons. Fetches aircraft for visible map bounds on zoom/pan (up to 450 km radius). Click for detail panel with AirLabs enrichment. |
| 📷 AR | Camera feed with aircraft/Moon/Sun overlaid at correct sky positions. Requires compass permission on iOS. Tap aircraft for quick popup. |

---

## How it works

1. Open the app and log in with your email (magic link, no password)
2. Grant GPS permission
3. The app queries flight APIs every 20 seconds for aircraft within your search radius
4. For each aircraft, it projects the trajectory forward in 5-second steps
5. Angular separation between projected aircraft position and Moon/Sun is calculated
6. When an aircraft is predicted to transit within your angular margin, a countdown alert appears
7. A push notification fires when the transit is within your configured lead time
8. In AR view, your compass + gyroscope determine where the camera is pointing; aircraft/Moon/Sun are rendered at their computed azimuth and elevation

### Key parameters

| Parameter | Default | Description |
|---|---|---|
| Search radius | 25 km | Geographic area queried for aircraft |
| Angular margin | ±0.5° | Detection threshold (Moon/Sun diameter ≈ 0.5°) |
| Notification lead | 3 min | How far in advance to send push alert |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| Styling | Tailwind CSS v4, glass morphism |
| Auth | Supabase Auth (magic link) |
| Database | Supabase (PostgreSQL) |
| Astronomy | [suncalc](https://github.com/mourner/suncalc) — client-side, no external API |
| Flight data | Airplanes.live, OpenSky Network (free, no key required) |
| Flight details | AirLabs API (free tier, on-demand per click) |
| Map | Leaflet + react-leaflet, OpenStreetMap tiles |
| AR | `getUserMedia`, `DeviceOrientationEvent`, custom azimuth/elevation projection |
| PWA / Push | `@ducanh2912/next-pwa`, Web Push API, Service Worker |
| i18n | next-intl |
| Analytics | Vercel Analytics |
| Deploy | Vercel |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key |
| `VAPID_EMAIL` | Yes | Email for VAPID contact |
| `AIRLABS_API_KEY` | Optional | AirLabs API key for origin/destination/airline data |

---

## Local development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- VAPID keys for Web Push

### Setup

```bash
git clone https://github.com/CristianoSticca/SolarMoon-PlaneTransitTracking.git
cd SolarMoon-PlaneTransitTracking
npm install
```

Create `.env.local` with the variables listed above, then:

```bash
npx web-push generate-vapid-keys   # generate VAPID keys
cat supabase/migrations/001_initial.sql  # apply schema in Supabase SQL Editor
npm run dev
```


**Live:** [transitsky.cristianosticca.com](https://transitsky.cristianosticca.com)

A progressive web app for astrophotographers to detect aircraft transits across the Moon and Sun in near-real-time. Open the app, share your GPS location, and get alerted when a plane is about to cross your celestial target — with enough lead time to prepare and shoot.

---

## Features

- **Real-time radar** — compass view centered on your position, with Moon and Sun as fixed points and aircraft moving toward them
- **Transit detection** — projects each aircraft's trajectory over 10 minutes, calculates angular separation from Moon/Sun, alerts you at first entry into the transit zone
- **Push notifications** — alerts even when the app is in background (requires PWA installation)
- **3-provider fallback** — ADSB-One → Airplanes.live → OpenSky Network, automatic failover
- **Configurable parameters** — search radius (10–50 km), angular margin (±0.2° / ±0.5° / ±1.5°), notification lead time
- **Screen wake lock** — keeps display on while monitoring
- **Bilingual** — Italian and English (switch in settings)
- **PWA** — installable on Android and iOS (16.4+) via "Add to Home Screen"

---

## How it works

1. Open the app and log in with your email (magic link, no password)
2. Grant GPS permission
3. The app queries flight APIs every 20 seconds for aircraft within your search radius
4. For each aircraft, it projects the trajectory forward in 5-second steps
5. Angular separation between the projected aircraft position and Moon/Sun is calculated
6. When an aircraft is predicted to transit within your angular margin, a countdown alert appears
7. A push notification fires when the transit is within your configured lead time

### Key parameters

| Parameter | Default | Description |
|---|---|---|
| Search radius | 25 km | Geographic area queried for aircraft |
| Angular margin | ±0.5° | Detection threshold (Moon/Sun diameter ≈ 0.5°) |
| Notification lead | 3 min | How far in advance to send push alert |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| Styling | Tailwind CSS v4, glass morphism |
| Auth | Supabase Auth (magic link) |
| Database | Supabase (PostgreSQL) |
| Astronomy | [suncalc](https://github.com/mourner/suncalc) — client-side, no external API |
| Flight data | ADSB-One, Airplanes.live, OpenSky Network (all free) |
| PWA / Push | `@ducanh2912/next-pwa`, Web Push API, Service Worker |
| i18n | next-intl |
| Deploy | Vercel |

---

## Local development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- VAPID keys for Web Push

### Setup

```bash
git clone https://github.com/CristianoSticca/SolarMoon-PlaneTransitTracking.git
cd SolarMoon-PlaneTransitTracking
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your@email.com
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Apply the database schema in the Supabase SQL Editor:
```bash
cat supabase/migrations/001_initial.sql
```

Run the dev server:
```bash
npm run dev
```

### Tests

```bash
npm test
```

The test suite covers the astronomy library (celestial position calculations, transit detection algorithm) and flight data normalizers.

---

## Database schema

```sql
-- User preferences (synced across devices)
user_preferences (
  user_id uuid PRIMARY KEY,
  language text DEFAULT 'it',
  search_radius_km int DEFAULT 25,
  angular_margin_deg float DEFAULT 0.5,
  notification_lead_min int DEFAULT 3
)

-- Web Push subscriptions
push_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid,
  subscription jsonb,  -- Web Push subscription object
  device_label text
)
```

Row Level Security is enabled on both tables — users can only read and write their own data.

---

## Flight data providers

| Priority | Provider | Auth required | Coverage |
|---|---|---|---|
| 1 | [ADSB-One](https://api.adsb.one) | No | Global |
| 2 | [Airplanes.live](https://airplanes.live) | No | Global |
| 3 | [OpenSky Network](https://opensky-network.org) | Optional | Excellent in Europe |

If a provider fails or times out (2s), the app automatically falls back to the next one. The active provider is shown in the monitor footer.

---

## Project structure

```
app/
  [locale]/
    login/          Magic link login
    onboarding/     GPS + notifications + install prompt
    monitor/        Main radar/list screen
    settings/       User preferences
    guide/          How-it-works with visual diagrams
  api/
    flights/        Flight data proxy (rate-limited, auth-gated)
    push/subscribe/ Web Push subscription endpoint
lib/
  astronomy/
    celestial.ts    Moon/Sun position via suncalc
    transit.ts      Transit detection algorithm
  flights/
    types.ts        Aircraft and FlightApiResponse interfaces
    normalizer.ts   Provider response normalizers
    providers.ts    Fetch functions with fallback chain
  supabase/
    client.ts       Browser Supabase client
    server.ts       Server-side Supabase client
hooks/
  useGeolocation.ts
  useFlights.ts         Polls /api/flights every 20s
  useTransitDetection.ts
  useWakeLock.ts
  usePushNotifications.ts
  useSessionLog.ts      Session log in sessionStorage
components/
  monitor/          RadarView, ListView, TransitAlert, MonitorToggle
  onboarding/       OnboardingSteps
  settings/         SettingsForm
  guide/            GuideContent with SVG diagrams
messages/
  it.json           Italian strings
  en.json           English strings
supabase/
  migrations/       001_initial.sql
```

---

## Deployment

The app is deployed on Vercel with automatic deployments on push to `main`.

**Environment variables to set in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`

After deploying, add your domain to Supabase → Authentication → URL Configuration as **Site URL** and **Redirect URL**.

---

## Roadmap (v2)

- Persistent transit history
- Server-side 24/7 monitoring (alerts without app open)
- Aircraft type / airline filters
- Social sharing of captures
- Support for ISS and planets

---

## License

MIT
