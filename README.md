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
- **Foreground push notifications** — alerts when the app is open in background
- **Background push notifications** — server-side cron (cron-job.org, every minute) checks transits for opted-in users and sends push even with the app fully closed; kill switch in Settings
- **2-provider fallback** — Airplanes.live → OpenSky Network, automatic failover
- **API health check** — built-in panel in Settings to verify provider and AirLabs connectivity
- **Configurable parameters** — search radius (10–450 km), angular margin (±0.2° / ±0.5° / ±1.5°), notification lead time
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

### Background push (server-side)

When enabled in Settings → "Notifiche in background":
- The app saves your GPS position to Supabase every 5 minutes
- An external cron (cron-job.org) calls `/api/cron/transit-check` every minute
- The cron queries flight data at your last known position, runs transit detection, and sends a push notification if a transit is imminent
- Works with the app fully closed
- Disable the toggle at any time — the cron will skip you immediately

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
| Push (foreground) | Web Push API, `web-push`, Service Worker (`public/sw.js`) |
| Push (background) | Server-side cron via [cron-job.org](https://cron-job.org), `/api/cron/transit-check` |
| i18n | next-intl |
| Deploy | Vercel |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (used by cron) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key |
| `VAPID_EMAIL` | Yes | Email for VAPID contact |
| `CRON_SECRET` | Yes | Secret to authenticate cron-job.org requests |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (e.g. `https://transitsky.cristianosticca.com`) |
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
# Apply both migrations in Supabase SQL Editor:
cat supabase/migrations/001_initial.sql
cat supabase/migrations/002_background_push.sql
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
  notification_lead_min int DEFAULT 3,
  last_lat float,                        -- last known GPS latitude (background push)
  last_lon float,                        -- last known GPS longitude (background push)
  last_seen_at timestamptz,              -- last time app was open with GPS active
  background_push_enabled boolean DEFAULT false
)

-- Web Push subscriptions
push_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE,
  subscription jsonb,  -- Web Push subscription object
  device_label text
)
```

Row Level Security is enabled on both tables — users can only read and write their own data.

---

## Flight data providers

| Priority | Provider | Auth required | Coverage |
|---|---|---|---|
| 1 | [Airplanes.live](https://airplanes.live) | No | Global |
| 2 | [OpenSky Network](https://opensky-network.org) | Optional | Excellent in Europe |

If a provider fails or times out (2s), the app automatically falls back to the next one. The active provider is shown in the monitor footer.

---

## Background push setup

The background cron is powered by [cron-job.org](https://cron-job.org) (free):

1. Create an account on cron-job.org
2. **Create cronjob**:
   - URL: `https://transitsky.cristianosticca.com/api/cron/transit-check`
   - Schedule: every **1 minute**
   - Headers: `Authorization` = `Bearer <CRON_SECRET>`
3. Save and enable

Vercel Hobby plan supports crons but only once per day, so the external cron is required for per-minute execution.

---

## Project structure

```
app/
  [locale]/
    login/          Magic link login
    onboarding/     GPS + notifications + install prompt
    monitor/        Main radar/list/map/AR screen
    settings/       User preferences + background push toggle
    guide/          How-it-works with visual diagrams
  api/
    flights/        Flight data proxy (rate-limited, auth-gated)
    flight-details/ AirLabs enrichment (airline, origin, destination)
    health/         Provider health check endpoint
    push/
      subscribe/    Save Web Push subscription to Supabase
      send/         Send a push notification via VAPID (internal)
      test/         Send a test push to the current user
    cron/
      transit-check/ Background cron: check transits, send push
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
  useFlights.ts           Polls /api/flights every 20s
  useTransitDetection.ts
  useWakeLock.ts
  usePushNotifications.ts  Handles SW registration + subscription
  useSessionLog.ts
components/
  monitor/          RadarView, ListView, MapView, ARView, TransitAlert, MonitorToggle
  onboarding/       OnboardingSteps
  settings/         SettingsForm
  guide/            GuideContent with SVG diagrams
public/
  sw.js             Service Worker (push handler)
  manifest.json     PWA manifest
messages/
  it.json           Italian strings
  en.json           English strings
supabase/
  migrations/
    001_initial.sql
    002_background_push.sql
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
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

After deploying, add your domain to Supabase → Authentication → URL Configuration as **Site URL** and **Redirect URL**.

Set up cron-job.org as described in [Background push setup](#background-push-setup).

---

## License

MIT
