import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  // Internal only — verify secret header
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { subscription, title, body } = await req.json()
  if (!subscription?.endpoint || !title) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: '/icons/icon-192.png', badge: '/icons/icon-72.png' })
    )
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode
    // 410 Gone = subscription expired/unsubscribed
    return NextResponse.json({ error: String(e), expired: status === 410 }, { status: 500 })
  }
}
