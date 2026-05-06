'use client'

import { useState, useEffect } from 'react'

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; lat: number; lon: number; accuracy: number }
  | { status: 'denied'; error: string }

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: 'denied', error: 'Geolocation not supported' })
      return
    }

    setState({ status: 'requesting' })

    const watchId = navigator.geolocation.watchPosition(
      pos => setState({
        status: 'granted',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      err => {
        // Only treat PERMISSION_DENIED as permanent — timeout/unavailable are transient
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setState({ status: 'denied', error: err.message })
        }
        // else: keep current state (don't flash red on GPS hiccup)
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return state
}
