import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as requisitionsApi from '@/api/requisitions'
import type { Requisition } from '@/api/requisitions'

const statusBadge: Record<string, string> = {
  Processed: 'bg-green-600',
  Approved: 'bg-blue-600',
  Rejected: 'bg-destructive',
}

// Translated from processRequisitions.php (Super-Admin-only approval UI) + processRequisition.php.
// Rebuilt on the shared PageHeader/DataTable primitives as part of the full-app redesign sweep
// (see MIGRATION_PLAN.md §10.11).
export default function ProcessRequisitions() {
  const queryClient = useQueryClient()
  const { data: requisitions } = useQuery({ queryKey: ['requisitions'], queryFn: requisitionsApi.list })
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [viewing, setViewing] = useState<Requisition | null>(null)
  const [confirming, setConfirming] = useState<Requisition | null>(null)

  const pending = requisitions?.filter((r) => r.status === 'Pending') ?? []

  const processMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      setConfirming(null)
    },
  })

  const pendingColumns: DataTableColumn<Requisition>[] = [
    { key: 'reqNumber', header: 'Req #', render: (r) => <span className="font-medium">{r.reqNumber}</span> },
    { key: 'pm', header: 'Project Manager', render: (r) => r.projectManager },
    { key: 'event', header: 'Event', render: (r) => r.eventName },
    { key: 'location', header: 'Location', render: (r) => r.location },
    { key: 'date', header: 'Date', render: (r) => new Date(r.eventDate).toLocaleDateString() },
    { key: 'type', header: 'Type', render: (r) => <span className="bg-secondary rounded px-2 py-0.5 text-xs">{r.displayType}</span> },
    { key: 'submittedBy', header: 'Submitted by', render: (r) => `${r.submittedBy.name} ${r.submittedBy.surname}` },
    {
      key: 'actions',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (r) => (
        <div className="flex justify-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </Button>
          <Button size="sm" onClick={() => setConfirming(r)}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Process
          </Button>
        </div>
      ),
    },
  ]

  const allColumns: DataTableColumn<Requisition>[] = [
    { key: 'reqNumber', header: 'Req #', render: (r) => <span className="font-medium">{r.reqNumber}</span> },
    { key: 'pm', header: 'Project Manager', render: (r) => r.projectManager },
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
    { key: 'date', header: 'Date', render: (r) => new Date(r.eventDate).toLocaleDateString() },
    { key: 'type', header: 'Type', render: (r) => <span className="bg-secondary rounded px-2 py-0.5 text-xs">{r.displayType}</span> },
    { key: 'submittedBy', header: 'Submitted by', render: (r) => `${r.submittedBy.name} ${r.submittedBy.surname}` },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusBadge[r.status] ?? 'bg-amber-500'}`}>{r.status}</span>
      ),
    },
    {
      key: 'processedBy',
      header: 'Processed by',
      render: (r) =>
        r.processedBy ? (
          <>
            {r.processedBy.name} {r.processedBy.surname}
            <div className="text-muted-foreground text-xs">{r.processedAt && new Date(r.processedAt).toLocaleString()}</div>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'View',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader
        title="Process Requisitions"
        action={<span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{pending.length} Pending</span>}
      />

      <div className="mb-5 flex w-fit gap-0.5 rounded-full bg-secondary p-1">
        <button
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === 'pending' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('pending')}
        >
          Pending ({pending.length})
        </button>
        <button
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === 'all' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('all')}
        >
          All Requisitions
        </button>
      </div>

      {tab === 'pending' && (
        <DataTable
          columns={pendingColumns}
          data={pending}
          keyExtractor={(r) => r.id}
          emptyMessage="All requisitions have been processed."
        />
      )}

      {tab === 'all' && (
        <DataTable columns={allColumns} data={requisitions ?? []} keyExtractor={(r) => r.id} emptyMessage="No requisitions found." />
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Requisition Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Requisition Number</dt>
                <dd className="font-semibold">{viewing.reqNumber}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Status</dt>
                <dd>{viewing.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Project Manager</dt>
                <dd>{viewing.projectManager}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Submitted by</dt>
                <dd>
                  {viewing.submittedBy.name} {viewing.submittedBy.surname}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Event Name</dt>
                <dd>{viewing.eventName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Location</dt>
                <dd>{viewing.location}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Event Date</dt>
                <dd>{new Date(viewing.eventDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Type</dt>
                <dd>{viewing.displayType}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs">Team Members</dt>
                <dd>{viewing.teamMembers || '—'}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Confirm Processing</h2>
            <p className="mb-1">Mark requisition</p>
            <p className="mb-1 text-lg font-bold">{confirming.reqNumber}</p>
            <p className="text-muted-foreground mb-4 text-sm">as Processed? This action cannot be undone.</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button onClick={() => processMutation.mutate(confirming.id)} disabled={processMutation.isPending}>
                {processMutation.isPending ? 'Processing…' : 'Yes, Process It'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
