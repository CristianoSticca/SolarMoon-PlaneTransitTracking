import { NextRequest, NextResponse } from 'next/server'
import { fetchFlightsWithFallback } from '@/lib/flights/providers'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lon = parseFloat(searchParams.get('lon') ?? '')
  const radius = parseInt(searchParams.get('radius') ?? '25', 10)

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }
  if (radius < 1 || radius > 100) {
    return NextResponse.json({ error: 'Radius must be 1–100 km' }, { status: 400 })
  }

  try {
    const result = await fetchFlightsWithFallback(lat, lon, radius)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('Flight fetch error:', err)
    return NextResponse.json({ error: 'All providers failed' }, { status: 503 })
  }
}
