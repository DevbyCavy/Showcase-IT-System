import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import * as requisitionsApi from '@/api/requisitions'
import type { Requisition } from '@/api/requisitions'

const statusBadge: Record<string, string> = {
  Processed: 'bg-green-600',
  Approved: 'bg-blue-600',
  Rejected: 'bg-destructive',
}

// Translated from processRequisitions.php (Super-Admin-only approval UI) + processRequisition.php.
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

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Process Requisitions</h1>
        <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
          {pending.length} Pending
        </span>
      </div>

      <div className="mb-4 flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-semibold ${tab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setTab('pending')}
        >
          Pending ({pending.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold ${tab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setTab('all')}
        >
          All Requisitions
        </button>
      </div>

      {tab === 'pending' && (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-3">Req #</th>
                <th className="p-3">Project Manager</th>
                <th className="p-3">Event</th>
                <th className="p-3">Location</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Submitted by</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    All requisitions have been processed.
                  </td>
                </tr>
              )}
              {pending.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-medium">{r.reqNumber}</td>
                  <td className="p-3">{r.projectManager}</td>
                  <td className="p-3">{r.eventName}</td>
                  <td className="p-3">{r.location}</td>
                  <td className="p-3">{new Date(r.eventDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs">{r.displayType}</span>
                  </td>
                  <td className="p-3">
                    {r.submittedBy.name} {r.submittedBy.surname}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
                        View
                      </Button>
                      <Button size="sm" variant="default" onClick={() => setConfirming(r)}>
                        Process
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'all' && (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-3">Req #</th>
                <th className="p-3">Project Manager</th>
                <th className="p-3">Event</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Submitted by</th>
                <th className="p-3">Status</th>
                <th className="p-3">Processed by</th>
                <th className="p-3 text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {(requisitions ?? []).length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No requisitions found.
                  </td>
                </tr>
              )}
              {requisitions?.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-medium">{r.reqNumber}</td>
                  <td className="p-3">{r.projectManager}</td>
                  <td className="p-3">
                    {r.eventName}
                    <div className="text-muted-foreground text-xs">{r.location}</div>
                  </td>
                  <td className="p-3">{new Date(r.eventDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs">{r.displayType}</span>
                  </td>
                  <td className="p-3">
                    {r.submittedBy.name} {r.submittedBy.surname}
                  </td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusBadge[r.status] ?? 'bg-amber-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.processedBy ? (
                      <>
                        {r.processedBy.name} {r.processedBy.surname}
                        <div className="text-muted-foreground text-xs">
                          {r.processedAt && new Date(r.processedAt).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
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
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Confirm Processing</h2>
            <p className="mb-1">Mark requisition</p>
            <p className="mb-1 text-lg font-bold">{confirming.reqNumber}</p>
            <p className="mb-4 text-muted-foreground text-sm">as Processed? This action cannot be undone.</p>
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
