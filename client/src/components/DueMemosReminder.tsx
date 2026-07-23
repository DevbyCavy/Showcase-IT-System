import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, StickyNote, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as memosApi from '@/api/memos'

// Translated from sidebarMarketing.php's due-reminder popup (checked in the shared sidebar so it
// fired on every page load, app-wide) + acknowledgeMemo.php (see MIGRATION_PLAN.md §10.18).
// Mounted once in AppShell so it applies to every role, matching the "Marketer" role having been
// dropped in Module 2's normalization (same precedent as the rest of the Memos feature). Polls
// every 30s like the app's other background-refresh widgets (TaskCalendar) so a memo that becomes
// due while the session is already open still gets caught, mirroring the legacy's "checked on
// every page load" behavior without literally reloading the page. Visibility is driven purely by
// the query result — "Got it" acknowledges, the list query is invalidated, and the modal
// disappears once the (now-empty) due list refetches; if acknowledging fails, the modal just stays
// open so the user can retry.
export function DueMemosReminder() {
  const queryClient = useQueryClient()
  const { data: dueMemos } = useQuery({
    queryKey: ['memos', 'due-reminders'],
    queryFn: memosApi.getDueReminders,
    refetchInterval: 30000,
  })

  const ackMutation = useMutation({
    mutationFn: (ids: number[]) => memosApi.acknowledge(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memos'] }),
  })

  const items = dueMemos ?? []
  if (items.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="text-brand-orange h-5 w-5" />
          <h2 className="text-lg font-semibold">Reminder{items.length > 1 ? 's' : ''}</h2>
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto">
          {items.map((m) => (
            <div key={m.id} className="border-b pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2 font-semibold">
                <StickyNote className="h-4 w-4 text-amber-500" />
                {m.title}
              </div>
              {m.description && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{m.description}</p>}
              <p className="text-muted-foreground mt-1 text-xs">
                Due {new Date(m.dueDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <Button
            className="bg-green-600 px-6 text-white hover:bg-green-700"
            onClick={() => ackMutation.mutate(items.map((m) => m.id))}
            disabled={ackMutation.isPending}
          >
            <Check className="mr-1.5 h-4 w-4" /> {ackMutation.isPending ? 'Saving…' : 'Got it'}
          </Button>
        </div>
      </div>
    </div>
  )
}
