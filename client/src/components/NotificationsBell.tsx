import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import * as requisitionsApi from '@/api/requisitions'
import * as quotationsApi from '@/api/quotations'

// Mirrors sidebarSuper.php's notifications dropdown: up to 5 pending quotations + a pending
// requisitions count, red dot if either > 0.
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { data: requisitions } = useQuery({ queryKey: ['requisitions'], queryFn: requisitionsApi.list })
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list })

  const pendingRequisitions = requisitions?.filter((r) => r.status === 'Pending') ?? []
  const pendingQuotations = (quotations?.filter((q) => q.status === 'Pending') ?? []).slice(0, 5)
  const hasNotifications = pendingRequisitions.length > 0 || pendingQuotations.length > 0

  return (
    <div className="relative">
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
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
          </div>
        </>
      )}
    </div>
  )
}
