import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useLiveTripTracking, type TrackingStatus } from '@/hooks/useLiveTripTracking'
import * as tripsApi from '@/api/vehicleTrips'

const STATUS_META: Partial<Record<TrackingStatus, { emoji: string; label: string }>> = {
  waiting: { emoji: '🟡', label: 'Waiting for GPS…' },
  tracking: { emoji: '🟢', label: 'Sharing trip location' },
  offline: { emoji: '🔴', label: 'Offline — will retry' },
  denied: { emoji: '🔴', label: 'Location permission denied' },
}

// Mounted once in AppShell (not per-page) so live GPS reporting keeps running no matter which
// page the driver is on while their trip is Active — see MIGRATION_PLAN.md §24. Finds the current
// user's own Active trip (if any) from the same /trips/active list Trip Logbook already uses, and
// drives useLiveTripTracking for it. Renders nothing for users with no Active trip of their own.
export function LiveTripTracker() {
  const { user } = useAuth()
  const { data: activeTrips } = useQuery({ queryKey: ['trips', 'active'], queryFn: tripsApi.active, refetchInterval: 30000 })
  const myTrip = useMemo(() => (activeTrips ?? []).find((t) => t.driver.id === user?.id) ?? null, [activeTrips, user?.id])

  const status = useLiveTripTracking(myTrip?.id ?? null)
  const meta = STATUS_META[status]

  if (!myTrip || !meta) return null

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-lg">
      <span>{meta.emoji}</span>
      {meta.label}
    </div>
  )
}
