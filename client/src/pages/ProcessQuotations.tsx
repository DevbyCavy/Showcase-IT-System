import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import * as quotationsApi from '@/api/quotations'
import type { Quotation } from '@/api/quotations'

// Translated from processQuotations.php + processQuotation.php (Super Admin only, scoped from
// feature/work-log-sheet, see MIGRATION_PLAN.md §10). Same atomic Pending-only approval guard as
// ProcessRequisitions.
export default function ProcessQuotations() {
  const queryClient = useQueryClient()
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list })
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [confirming, setConfirming] = useState<Quotation | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const approveMutation = useMutation({
    mutationFn: (id: number) => quotationsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      setConfirming(null)
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

  const pending = (quotations ?? []).filter((q) => q.status === 'Pending')
  const rows = tab === 'pending' ? pending : (quotations ?? [])

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Process Quotations</h1>
        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold">{pending.length} Pending</span>
      </div>

      <div className="mb-4 flex gap-2 border-b">
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'Pending' : 'All Quotations'}
          </button>
        ))}
      </div>

      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">Quotation #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Project</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Submitted by</th>
              {tab === 'all' && <th className="p-3">Status</th>}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={tab === 'all' ? 8 : 7} className="p-6 text-center text-muted-foreground">
                  {tab === 'pending' ? 'All quotations have been approved.' : 'No quotations found.'}
                </td>
              </tr>
            )}
            {rows.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="p-3 font-medium">{q.quotationNumber}</td>
                <td className="p-3">{q.customerName}</td>
                <td className="p-3">{q.projectName}</td>
                <td className="p-3">{new Date(q.quoteDate).toLocaleDateString()}</td>
                <td className="p-3">${Number(q.total).toFixed(2)}</td>
                <td className="p-3">
                  {q.submittedBy.name} {q.submittedBy.surname}
                </td>
                {tab === 'all' && (
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium text-white ${q.status === 'Approved' ? 'bg-green-600' : 'bg-amber-500'}`}
                    >
                      {q.status}
                    </span>
                  </td>
                )}
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(q.id, q.quotationNumber)}>
                      PDF
                    </Button>
                    {q.status === 'Pending' && (
                      <Button size="sm" onClick={() => setConfirming(q)}>
                        Approve
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirming(null)}>
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-lg" onClick={(e) => e.stopPropagation()}>
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
    </div>
  )
}
