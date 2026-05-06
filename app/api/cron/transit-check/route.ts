import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchFlightsWithFallback } from '@/lib/flights/providers'
import { detectTransits } from '@/lib/astronomy/transit'
import { getMoonPosition, getSunPosition } from '@/lib/astronomy/celestial'

const STALE_MINUTES = 30  // ignore users not seen in last 30 min

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const staleThreshold = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString()

  // Get users with background push enabled and recent GPS
  const { data: users, error } = await supabase
    .from('user_preferences')
    .select('user_id, last_lat, last_lon, search_radius_km, angular_margin_deg, notification_lead_min')
    .eq('background_push_enabled', true)
    .not('last_lat', 'is', null)
    .not('last_lon', 'is', null)
    .gte('last_seen_at', staleThreshold)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!users?.length) return NextResponse.json({ checked: 0 })

  // Fetch push subscriptions separately
  const userIds = users.map(u => u.user_id)
  const { data: allSubs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription')
    .in('user_id', userIds)

  if (subsError) return NextResponse.json({ error: subsError.message }, { status: 500 })

  const subsByUser = new Map<string, object[]>()
  for (const s of allSubs ?? []) {
    const arr = subsByUser.get(s.user_id) ?? []
    arr.push(s.subscription)
    subsByUser.set(s.user_id, arr)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  let notified = 0

  for (const user of users) {
    const subs = subsByUser.get(user.user_id) ?? []
    if (!subs.length) continue

    const lat = user.last_lat as number
    const lon = user.last_lon as number
    const radiusKm = (user.search_radius_km as number) ?? 25
    const marginDeg = (user.angular_margin_deg as number) ?? 0.5
    const leadSec = ((user.notification_lead_min as number) ?? 3) * 60

    try {
      const flightData = await fetchFlightsWithFallback(lat, lon, radiusKm)
      const now = new Date()
      const moon = getMoonPosition(lat, lon, now)
      const sun = getSunPosition(lat, lon, now)
      const { events } = detectTransits(
        flightData.aircraft,
        { lat, lon },
        moon,
        sun,
        { marginDeg }
      )

      const imminent = events.filter(ev => ev.countdown <= leadSec)
      if (!imminent.length) continue

      const ev = imminent[0]
      const targetLabel = ev.target === 'moon' ? '🌙 Luna' : '☀️ Sole'
      const title = `✈ ${ev.aircraft.callsign || ev.aircraft.icao} → ${targetLabel}`
      const body = `Transito tra ${Math.ceil(ev.countdown / 60)} min · Scarto ±${ev.minAngularSeparation.toFixed(2)}°`

      for (const subscription of subs) {
        const res = await fetch(`${baseUrl}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET!,
          },
          body: JSON.stringify({ subscription, title, body }),
        })
        const data = await res.json()
        // Clean up expired subscriptions
        if (data.expired) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.user_id)
        }
        notified++
      }
    } catch {
      // Skip user on error, continue with others
    }
  }

  return NextResponse.json({ checked: users.length, notified })
}
