'use client'

import { useState, useCallback } from 'react'

export type PushState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications(): {
  state: PushState
  request: () => Promise<void>
  notify: (title: string, body: string) => void
} {
  const [state, setState] = useState<PushState>(() => {
    if (typeof window === 'undefined') return 'idle'
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
    const perm = Notification.permission
    if (perm === 'granted') return 'granted'
    if (perm === 'denied') return 'denied'
    return 'idle'
  })

  const request = useCallback(async () => {
    if (state === 'unsupported') return
    setState('requesting')

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setState('denied')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        }))

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      setState('granted')
    } catch {
      setState('denied')
    }
  }, [state])

  const notify = useCallback(
    (title: string, body: string) => {
      // Check live permission — state may be stale if granted in a previous session
      if (Notification.permission !== 'granted') return
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

  return { state, request, notify }
}
