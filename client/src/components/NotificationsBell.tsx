import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import * as requisitionsApi from '@/api/requisitions'
import * as quotationsApi from '@/api/quotations'

const POLL_INTERVAL_MS = 15000

// Mirrors sidebarSuper.php's notifications dropdown: up to 5 pending quotations + a pending
// requisitions count, red dot if either > 0. The Pending Quotations section is Super Admin-only
// (they're the one who acts on it — a Marketer's own approval alerts live on Make Quotation
// itself instead) and only fetched for that role now that quotations are Marketer/Super
// Admin-only (see MIGRATION_PLAN.md §21) — polls every 15s and briefly pings the bell icon when a
// new Pending quotation shows up.
export function NotificationsBell() {
  const { user } = useAuth()
  const canSeeQuotations = user?.role === 'SuperAdmin'
  const [open, setOpen] = useState(false)
  const [pinging, setPinging] = useState(false)
  const knownPendingIdsRef = useRef<Set<number> | null>(null)

  const { data: requisitions } = useQuery({ queryKey: ['requisitions'], queryFn: requisitionsApi.list })
  const { data: quotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationsApi.list,
    enabled: canSeeQuotations,
    refetchInterval: canSeeQuotations ? POLL_INTERVAL_MS : false,
  })

  const pendingRequisitions = requisitions?.filter((r) => r.status === 'Pending') ?? []
  const allPendingQuotations = quotations?.filter((q) => q.status === 'Pending') ?? []
  const pendingQuotations = allPendingQuotations.slice(0, 5)
  const hasNotifications = pendingRequisitions.length > 0 || pendingQuotations.length > 0

  useEffect(() => {
    if (!canSeeQuotations) return
    const currentIds = new Set(allPendingQuotations.map((q) => q.id))
    const known = knownPendingIdsRef.current
    const hasNewArrival = known !== null && allPendingQuotations.some((q) => !known.has(q.id))
    knownPendingIdsRef.current = currentIds

    if (hasNewArrival) {
      setPinging(true)
      const timer = setTimeout(() => setPinging(false), 3000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotations])

  return (
    <div className="relative">
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        onClick={() => {
          setOpen((v) => !v)
          setPinging(false)
        }}
      >
        <Bell className={`h-5 w-5 ${pinging ? 'animate-bounce text-brand-orange' : ''}`} />
        {hasNotifications && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border bg-card p-2">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Pending Requisitions</div>
            <div className="px-2 pb-2 text-sm">
              {pendingRequisitions.length === 0 ? (
                <span className="text-muted-foreground">None</span>
              ) : (
                `${pendingRequisitions.length} awaiting processing`
              )}
            </div>
            {canSeeQuotations && (
              <>
                <div className="border-t px-2 py-1 text-xs font-semibold text-muted-foreground">Pending Quotations</div>
                <div className="max-h-48 overflow-y-auto">
                  {pendingQuotations.length === 0 && (
                    <div className="px-2 py-2 text-sm text-muted-foreground">None</div>
                  )}
                  {pendingQuotations.map((q) => (
                    <div key={q.id} className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{q.quotationNumber}</div>
                      <div className="text-xs text-muted-foreground">{q.customerName}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
