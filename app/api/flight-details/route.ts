import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const callsign = req.nextUrl.searchParams.get('callsign')?.trim()
  if (!callsign) {
    return NextResponse.json({ error: 'Missing callsign' }, { status: 400 })
  }

  const apiKey = process.env.AIRLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(
      `https://airlabs.co/api/v9/flight?flight_icao=${encodeURIComponent(callsign)}&api_key=${apiKey}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error(`AirLabs HTTP ${res.status}`)
    const data = await res.json()
    const f = data.response
    if (!f) return NextResponse.json(null)

    return NextResponse.json({
      airline: f.airline_iata ?? null,
      airlineName: f.airline_name ?? null,
      depIata: f.dep_iata ?? null,
      depCity: f.dep_city ?? null,
      arrIata: f.arr_iata ?? null,
      arrCity: f.arr_city ?? null,
      status: f.status ?? null,
      aircraftIcao: f.aircraft_icao ?? null,
    })
  } catch (e) {
    console.error('[flight-details]', e)
    return NextResponse.json(null)
  }
}
