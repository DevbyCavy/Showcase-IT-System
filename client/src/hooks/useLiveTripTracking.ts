import { useEffect, useRef, useState } from 'react'
import * as trackingApi from '@/api/tracking'
import { enqueuePing, flushQueue } from '@/lib/trackingQueue'

export type TrackingStatus = 'idle' | 'waiting' | 'tracking' | 'offline' | 'denied'

// Matches the spec's "every 15–30 seconds" — 20s split the difference.
const PING_INTERVAL_MS = 20000
const POSITION_TIMEOUT_MS = 15000

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: POSITION_TIMEOUT_MS,
      maximumAge: 10000,
    })
  })
}

function toPing(tripId: number, pos: GeolocationPosition): trackingApi.LocationPing {
  return {
    tripId,
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? undefined,
    speed: pos.coords.speed ?? undefined,
    heading: pos.coords.heading ?? undefined,
  }
}

// Drives the whole live-tracking lifecycle for one Active trip: requests GPS permission, pings
// /tracking/start once then /tracking/update on an interval, queues pings that fail to send
// (device offline) and flushes them once connectivity returns, and sends a best-effort
// /tracking/end ping when the trip stops being active (component unmounts / tripId goes null).
// See MIGRATION_PLAN.md §24 — mounted app-wide via LiveTripTracker, not tied to one page, since a
// driver might navigate elsewhere in the app mid-trip.
export function useLiveTripTracking(tripId: number | null): TrackingStatus {
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (tripId === null) {
      setStatus('idle')
      hasStartedRef.current = false
      return
    }
    if (!('geolocation' in navigator)) {
      setStatus('denied')
      return
    }

    let cancelled = false
    hasStartedRef.current = false
    setStatus('waiting')

    async function tick() {
      if (cancelled) return
      let pos: GeolocationPosition
      try {
        pos = await getPosition()
      } catch (err) {
        if (cancelled) return
        setStatus((err as GeolocationPositionError)?.code === 1 ? 'denied' : 'waiting')
        return
      }
      if (cancelled) return

      const ping = toPing(tripId!, pos)
      const send = hasStartedRef.current ? trackingApi.update : trackingApi.start
      try {
        await send(ping)
        hasStartedRef.current = true
        if (!cancelled) setStatus('tracking')
        await flushQueue((p) => trackingApi.update(p))
      } catch {
        enqueuePing(ping)
        if (!cancelled) setStatus('offline')
      }
    }

    tick()
    const intervalId = window.setInterval(tick, PING_INTERVAL_MS)

    function handleOnline() {
      flushQueue((p) => trackingApi.update(p))
    }
    window.addEventListener('online', handleOnline)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
      if (hasStartedRef.current) {
        getPosition()
          .then((pos) => trackingApi.end(toPing(tripId!, pos)))
          .catch(() => {})
      }
    }
  }, [tripId])

  return status
}
