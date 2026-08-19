import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileDown, Check, Pencil, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { ToastStack, type ToastItem } from '@/components/ui/toast'
import { QuotationEditModal } from '@/components/QuotationEditModal'
import * as quotationsApi from '@/api/quotations'
import type { Quotation } from '@/api/quotations'

// Matches the app's other near-real-time polls (Task Calendar, Tracking) — drives the "new
// quotation submitted" alert below.
const POLL_INTERVAL_MS = 15000

// Translated from processQuotations.php + processQuotation.php (Super Admin only, scoped from
// feature/work-log-sheet, see MIGRATION_PLAN.md §10). Same atomic Pending-only approval guard as
// ProcessRequisitions. Rebuilt on the shared PageHeader/DataTable primitives as part of the
// full-app redesign sweep (see MIGRATION_PLAN.md §10.11).
export default function ProcessQuotations() {
  const queryClient = useQueryClient()
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list, refetchInterval: POLL_INTERVAL_MS })
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [confirming, setConfirming] = useState<Quotation | null>(null)
  const [rejecting, setRejecting] = useState<Quotation | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Quotation | null>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set())
  const nextToastId = useRef(0)
  const knownIdsRef = useRef<Set<number> | null>(null)

  const pending = (quotations ?? []).filter((q) => q.status === 'Pending')

  // Real-time "new quotation submitted" alert: on every poll, any Pending quotation whose id
  // wasn't seen last poll is newly submitted — toast + a temporary row highlight. First run just
  // records the baseline (a page load shouldn't announce the existing backlog as "new").
  useEffect(() => {
    const currentIds = new Set(pending.map((q) => q.id))
    if (knownIdsRef.current) {
      const known = knownIdsRef.current
      for (const q of pending) {
        if (!known.has(q.id)) {
          setToasts((t) => [
            ...t,
            { id: nextToastId.current++, message: `New quotation submitted: ${q.quotationNumber} by ${q.submittedBy.name} ${q.submittedBy.surname}`, tone: 'info' },
          ])
          setHighlightedIds((h) => new Set(h).add(q.id))
          setTimeout(() => setHighlightedIds((h) => { const next = new Set(h); next.delete(q.id); return next }), 8000)
        }
      }
    }
    knownIdsRef.current = currentIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotations])

  const approveMutation = useMutation({
    mutationFn: (id: number) => quotationsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      setConfirming(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => quotationsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      setRejecting(null)
      setRejectReason('')
    },
  })

  async function handleDownload(id: number, quotationNumber: string) {
    setDownloadError(null)
    try {
      await quotationsApi.downloadPdf(id, quotationNumber)
    } catch {
      setDownloadError('Failed to download PDF.')
    }
  }

  const rows = tab === 'pending' ? pending : (quotations ?? [])

  const actionsColumn: DataTableColumn<Quotation> = {
    key: 'actions',
    header: 'Actions',
    render: (q) => (
      <div className="flex gap-1.5">
        {q.status === 'Approved' && (
          <Button size="sm" variant="outline" onClick={() => handleDownload(q.id, q.quotationNumber)}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        )}
        {q.status === 'Pending' && (
          <>
            <Button size="sm" onClick={() => setConfirming(q)}>
              <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => setRejecting(q)}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Reject
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => setEditing(q)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
      </div>
    ),
  }

  const baseColumns: DataTableColumn<Quotation>[] = [
    { key: 'quotationNumber', header: 'Quotation #', render: (q) => <span className="font-medium">{q.quotationNumber}</span> },
    { key: 'customer', header: 'Customer', render: (q) => q.customerName },
    { key: 'project', header: 'Project', render: (q) => q.projectName },
    { key: 'date', header: 'Date', render: (q) => new Date(q.quoteDate).toLocaleDateString() },
    { key: 'total', header: 'Total', render: (q) => `$${Number(q.total).toFixed(2)}` },
    { key: 'submittedBy', header: 'Submitted by', render: (q) => `${q.submittedBy.name} ${q.submittedBy.surname}` },
  ]

  const statusColumn: DataTableColumn<Quotation> = {
    key: 'status',
    header: 'Status',
    render: (q) => (
      <div className="space-y-1">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium text-white ${
            q.status === 'Approved' ? 'bg-green-600' : q.status === 'Rejected' ? 'bg-destructive' : 'bg-amber-500'
          }`}
        >
          {q.status}
        </span>
        {q.status === 'Rejected' && q.rejectionReason && (
          <div className="text-destructive flex items-start gap-1 text-xs">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{q.rejectionReason}</span>
          </div>
        )}
      </div>
    ),
  }

  const columns = tab === 'all' ? [...baseColumns, statusColumn, actionsColumn] : [...baseColumns, actionsColumn]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader
        title="Process Quotations"
        action={<span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{pending.length} Pending</span>}
      />

      <div className="mb-5 flex w-fit gap-0.5 rounded-full bg-secondary p-1">
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'Pending' : 'All Quotations'}
          </button>
        ))}
      </div>

      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(q) => q.id}
        emptyMessage={tab === 'pending' ? 'All quotations have been approved.' : 'No quotations found.'}
        rowClassName={(q) => (highlightedIds.has(q.id) ? 'bg-amber-50 animate-pulse' : '')}
      />

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirming(null)}>
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold">Confirm Approval</h3>
            <p className="mb-1">Approve quotation</p>
            <p className="mb-2 text-lg font-bold">{confirming.quotationNumber}</p>
            <p className="text-muted-foreground mb-5 text-sm">This will mark it as Approved.</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => approveMutation.mutate(confirming.id)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? 'Approving…' : 'Yes, Approve It'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setRejecting(null)
            setRejectReason('')
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold">Reject Quotation</h3>
            <p className="mb-1">Reject quotation</p>
            <p className="mb-2 text-lg font-bold">{rejecting.quotationNumber}</p>
            <p className="text-muted-foreground mb-3 text-sm">
              This sends it back to {rejecting.submittedBy.name} {rejecting.submittedBy.surname} to fix and resubmit.
            </p>
            <textarea
              className="border-input mb-4 w-full rounded-md border bg-transparent px-3 py-2 text-left text-sm"
              rows={3}
              placeholder="Reason for rejecting…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejecting(null)
                  setRejectReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => rejectMutation.mutate({ id: rejecting.id, reason: rejectReason.trim() })}
                disabled={rejectMutation.isPending || rejectReason.trim() === ''}
              >
                {rejectMutation.isPending ? 'Rejecting…' : 'Yes, Reject It'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastStack items={toasts} onDismiss={(id) => setToasts((t) => t.filter((item) => item.id !== id))} />

      {editing && <QuotationEditModal quotation={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
