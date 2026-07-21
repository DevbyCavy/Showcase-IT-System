import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as requisitionsApi from '@/api/requisitions'
import type { RequisitionType } from '@/api/requisitions'

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

// Translated from requisitions.php + createRequisition.php.
export default function Requisitions() {
  const queryClient = useQueryClient()
  const { data: requisitions } = useQuery({ queryKey: ['requisitions'], queryFn: requisitionsApi.list })
  const [search, setSearch] = useState('')

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

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold">Requisitions</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="font-semibold">New Requisition</h2>

          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

          <div className="space-y-1">
            <label className="text-sm font-medium">Project Manager Name</label>
            <Input value={form.projectManager} onChange={(e) => setForm({ ...form, projectManager: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Name of Event</label>
            <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date of Event</label>
            <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
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
                  className={`rounded-full border-2 px-4 py-1 text-sm font-semibold ${
                    form.reqType === t.value ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
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
            {mutation.isPending ? 'Submitting…' : 'Submit Requisition'}
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Submitted Requisitions</h2>
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[160px]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-2">Req #</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No requisitions submitted yet.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-medium">{r.reqNumber}</td>
                    <td className="p-2">
                      {r.eventName}
                      <div className="text-muted-foreground text-xs">{r.location}</div>
                    </td>
                    <td className="p-2">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs">{r.displayType}</span>
                    </td>
                    <td className="p-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${statusBadge[r.status] ?? 'bg-amber-500'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
