'use client'

import { useState, useCallback, useEffect } from 'react'

export type PushState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

async function saveSubscriptionToSupabase(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    }))
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })
  return res.ok
}

export function usePushNotifications(): {
  state: PushState
  subscribed: boolean
  request: () => Promise<void>
  resubscribe: () => Promise<void>
  notify: (title: string, body: string) => void
} {
  const [state, setState] = useState<PushState>(() => {
    if (typeof window === 'undefined') return 'idle'
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
    const perm = Notification.permission
    if (perm === 'granted') return 'granted'
    if (perm === 'denied') return 'denied'
    return 'idle'
  })
  const [subscribed, setSubscribed] = useState(false)

  // On mount: try to silently re-save existing subscription (no new subscription attempt)
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription()
      if (!existing) return  // no existing subscription — user must click resubscribe
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: existing }),
      })
      if (res.ok) setSubscribed(true)
    }).catch(() => {})
  }, [])

  const resubscribe = useCallback(async () => {
    try {
      const ok = await saveSubscriptionToSupabase()
      if (ok) setSubscribed(true)
    } catch {}
  }, [])

  const request = useCallback(async () => {
    if (state === 'unsupported') return
    setState('requesting')

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setState('denied')
      return
    }

    try {
      const ok = await saveSubscriptionToSupabase()
      if (ok) setSubscribed(true)
      setState('granted')
    } catch {
      setState('denied')
    }
  }, [state])

  const notify = useCallback(
    (title: string, body: string) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
        })
      })
    },
    []
  )

  return { state, subscribed, request, resubscribe, notify }
}
