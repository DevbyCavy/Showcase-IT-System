import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Undo2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as inventoryApi from '@/api/inventory'
import type { IssuedTool } from '@/api/inventory'

// New feature (§33): issuing a returnable product asks for a return date, and once that date is
// due/overdue, both the collector and Stores/Super Admin get reminded — same
// poll-every-30s/"Got it"-acknowledges pattern as DueMemosReminder, but with two independent
// sections (own acknowledgment doesn't dismiss the other's). Mounted app-wide like
// DueMemosReminder/LiveTripTracker — everyone can be a collector regardless of role, so this isn't
// role-gated the way DueMemosReminder is; it just renders nothing when both lists are empty
// (which is always true for a non-Stores role with nothing overdue).
export function DueReturnsReminder() {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['inventory', 'due-reminders'],
    queryFn: inventoryApi.getDueReminders,
    refetchInterval: 30000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inventory', 'due-reminders'] })
  const collectorAck = useMutation({
    mutationFn: (ids: number[]) => inventoryApi.acknowledgeAsCollector(ids),
    onSuccess: invalidate,
  })
  const storesAck = useMutation({
    mutationFn: (ids: number[]) => inventoryApi.acknowledgeAsStores(ids),
    onSuccess: invalidate,
  })

  const asCollector = data?.asCollector ?? []
  const asStores = data?.asStores ?? []
  if (asCollector.length === 0 && asStores.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Undo2 className="text-brand-orange h-5 w-5" />
          <h2 className="text-lg font-semibold">Return Reminders</h2>
        </div>

        {asCollector.length > 0 && (
          <div className="mb-4">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Items you need to return</h3>
            <ReminderList items={asCollector} showCollector={false} />
            <div className="mt-2.5 flex justify-center">
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => collectorAck.mutate(asCollector.map((t) => t.id))}
                disabled={collectorAck.isPending}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" /> {collectorAck.isPending ? 'Saving…' : "I've returned these"}
              </Button>
            </div>
          </div>
        )}

        {asStores.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Overdue returns (Stores)</h3>
            <ReminderList items={asStores} showCollector />
            <div className="mt-2.5 flex justify-center">
              <Button size="sm" variant="outline" onClick={() => storesAck.mutate(asStores.map((t) => t.id))} disabled={storesAck.isPending}>
                <Check className="mr-1.5 h-3.5 w-3.5" /> {storesAck.isPending ? 'Saving…' : 'Got it'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReminderList({ items, showCollector }: { items: IssuedTool[]; showCollector: boolean }) {
  return (
    <div className="max-h-48 space-y-2.5 overflow-y-auto">
      {items.map((t) => (
        <div key={t.id} className="border-b pb-2 last:border-b-0 last:pb-0">
          <div className="font-semibold">
            {t.toolName} × {t.quantityIssued}
          </div>
          {showCollector && <div className="text-muted-foreground text-xs">Collector: {t.collectorName}</div>}
          <div className="text-muted-foreground text-xs">Job: {t.jobName}</div>
          <div className="text-muted-foreground text-xs">
            Due {t.dateOfReturn ? new Date(t.dateOfReturn).toLocaleDateString() : 'Unknown'}
          </div>
        </div>
      ))}
    </div>
  )
}
