import { NextResponse } from 'next/server'

type Status = 'ok' | 'error' | 'unconfigured'

async function checkProvider(name: string, url: string): Promise<{ name: string; status: Status; ms: number }> {
  const t0 = Date.now()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    return { name, status: res.ok ? 'ok' : 'error', ms: Date.now() - t0 }
  } catch {
    return { name, status: 'error', ms: Date.now() - t0 }
  }
}

export async function GET() {
  // Use Rome as fixed test coordinate — always has traffic
  const lat = 41.9
  const lon = 12.5
  const nm = 10

  const [ap] = await Promise.all([
    checkProvider('Airplanes.live', `https://api.airplanes.live/v2/point/${lat}/${lon}/${nm}`),
  ])

  // ADSB-One blocks server-side requests (Cloudflare 403/526) — excluded from chain
  const ao: { name: string; status: Status; ms: number } = { name: 'ADSB-One', status: 'unconfigured', ms: 0 }

  const airlabsConfigured = !!process.env.AIRLABS_API_KEY
  let airlabs: { name: string; status: Status; ms: number }
  if (!airlabsConfigured) {
    airlabs = { name: 'AirLabs', status: 'unconfigured', ms: 0 }
  } else {
    const t0 = Date.now()
    try {
      const res = await fetch(
        `https://airlabs.co/api/v9/ping?api_key=${process.env.AIRLABS_API_KEY}`,
        { signal: AbortSignal.timeout(6000) }
      )
      airlabs = { name: 'AirLabs', status: res.ok ? 'ok' : 'error', ms: Date.now() - t0 }
    } catch {
      airlabs = { name: 'AirLabs', status: 'error', ms: Date.now() - t0 }
    }
  }

  return NextResponse.json({
    providers: [ap, ao, airlabs],
    checkedAt: new Date().toISOString(),
  })
}
