import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { ToastStack, type ToastItem } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import * as requisitionsApi from '@/api/requisitions'
import type { Requisition, RequisitionType } from '@/api/requisitions'

const TYPES: { value: RequisitionType; label: string }[] = [
  { value: 'Food', label: 'Food' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Tool', label: 'Tool' },
  { value: 'Other', label: 'Other' },
]

const statusBadge: Record<string, string> = {
  Processed: 'bg-green-600',
  Approved: 'bg-blue-600',
  Rejected: 'bg-destructive',
}

// Matches the app's other near-real-time polls (Task Calendar, Tracking, Process Quotations).
const POLL_INTERVAL_MS = 15000

// Translated from requisitions.php + createRequisition.php. Rebuilt on the shared
// Card/PageHeader/DataTable primitives as part of the full-app redesign sweep (see
// MIGRATION_PLAN.md §10.11).
export default function Requisitions() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  // Production only submits requisitions (materials/tools for a job) — they don't need to see
  // everyone else's, so the table is hidden for that role specifically (per Calvin's request).
  // Every other role keeps the existing behavior unchanged.
  const showTable = user?.role !== 'ProductionTeam'
  const { data: requisitions } = useQuery({
    queryKey: ['requisitions'],
    queryFn: requisitionsApi.list,
    enabled: showTable,
    refetchInterval: showTable ? POLL_INTERVAL_MS : false,
  })
  const [search, setSearch] = useState('')

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set())
  const nextToastId = useRef(0)
  const prevStatusRef = useRef<Map<number, string> | null>(null)

  // Real-time "your requisition was processed" alert, scoped to the current user's own
  // submissions — covers both a Super Admin manually processing one and a Product-type shortfall
  // requisition getting auto-fulfilled by a restock (see MIGRATION_PLAN.md §30). Same
  // first-poll-is-baseline pattern as MakeQuotation.tsx's approval alert (§25) — opening the page
  // shouldn't announce the existing backlog as "just happened."
  useEffect(() => {
    const mine = (requisitions ?? []).filter((r) => r.submittedBy.id === user?.id)
    const currentStatus = new Map(mine.map((r) => [r.id, r.status]))
    if (prevStatusRef.current) {
      const prev = prevStatusRef.current
      for (const r of mine) {
        if (r.status === 'Processed' && prev.get(r.id) === 'Pending') {
          const message =
            r.reqType === 'Product' && r.product
              ? `${r.product.name} you needed is now back in stock (${r.reqNumber})!`
              : `Your requisition ${r.reqNumber} was processed!`
          setToasts((t) => [...t, { id: nextToastId.current++, message, tone: 'success' }])
          setHighlightedIds((h) => new Set(h).add(r.id))
          setTimeout(() => setHighlightedIds((h) => { const next = new Set(h); next.delete(r.id); return next }), 8000)
        }
      }
    }
    prevStatusRef.current = currentStatus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requisitions])

  const [form, setForm] = useState({
    projectManager: '',
    eventName: '',
    location: '',
    eventDate: '',
    teamMembers: '',
    reqType: '' as RequisitionType | '',
    reqTypeOther: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      requisitionsApi.create({
        projectManager: form.projectManager,
        eventName: form.eventName,
        location: form.location,
        eventDate: form.eventDate,
        teamMembers: form.teamMembers || undefined,
        reqType: form.reqType as RequisitionType,
        reqTypeOther: form.reqTypeOther || undefined,
      }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      setSuccess(`Requisition ${r.reqNumber} submitted successfully!`)
      setForm({ projectManager: '', eventName: '', location: '', eventDate: '', teamMembers: '', reqType: '', reqTypeOther: '' })
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to submit requisition') : 'Failed to submit requisition')
    },
  })

  const filtered = (requisitions ?? []).filter((r) =>
    [r.reqNumber, r.projectManager, r.eventName, r.displayType, r.status].join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Requisition>[] = [
    { key: 'reqNumber', header: 'Req #', render: (r) => <span className="font-medium">{r.reqNumber}</span> },
    {
      key: 'event',
      header: 'Event',
      render: (r) => (
        <>
          {r.eventName}
          <div className="text-muted-foreground text-xs">{r.location}</div>
        </>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <span className="bg-secondary rounded px-2 py-0.5 text-xs">{r.displayType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusBadge[r.status] ?? 'bg-amber-500'}`}>{r.status}</span>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader title="Requisitions" />

      <div className={showTable ? 'grid grid-cols-1 gap-5 lg:grid-cols-2' : 'max-w-xl'}>
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-semibold">New Requisition</h2>

            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Project Manager Name</label>
                <Input value={form.projectManager} onChange={(e) => setForm({ ...form, projectManager: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Name of Event</label>
                <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Location</label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Date of Event</label>
                <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Team Members <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Input value={form.teamMembers} onChange={(e) => setForm({ ...form, teamMembers: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Type of Requisition</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`rounded-full border-2 px-4 py-1 text-sm font-semibold transition-colors ${
                      form.reqType === t.value ? 'border-brand-orange bg-brand-orange text-white' : 'border-input hover:bg-secondary'
                    }`}
                    onClick={() => setForm({ ...form, reqType: t.value })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {form.reqType === 'Other' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Please specify</label>
                <Input value={form.reqTypeOther} onChange={(e) => setForm({ ...form, reqTypeOther: e.target.value })} />
              </div>
            )}

            <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.reqType}>
              <Send className="mr-1.5 h-4 w-4" />
              {mutation.isPending ? 'Submitting…' : 'Submit Requisition'}
            </Button>
          </CardContent>
        </Card>

        {showTable && (
          <div>
            <h2 className="mb-3 font-semibold">Submitted Requisitions</h2>
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(r) => r.id}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search..."
              emptyMessage="No requisitions submitted yet."
              pageSize={8}
              rowClassName={(r) => (highlightedIds.has(r.id) ? 'bg-green-50 animate-pulse' : '')}
            />
          </div>
        )}
      </div>

      <ToastStack items={toasts} onDismiss={(id) => setToasts((t) => t.filter((item) => item.id !== id))} />
    </div>
  )
}
