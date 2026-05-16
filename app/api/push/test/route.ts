import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', user.id)

  if (!subs?.length) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  const errors: string[] = []
  for (const { subscription } of subs) {
    try {
      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        JSON.stringify({
          title: '✈ Test AstroTransit',
          body: 'Le notifiche in background funzionano correttamente!',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
        })
      )
    } catch (e) {
      errors.push(String(e))
    }
  }

  if (errors.length === subs.length) {
    return NextResponse.json({ error: errors[0] }, { status: 500 })
  }
  return NextResponse.json({ ok: true, sent: subs.length - errors.length })
}
