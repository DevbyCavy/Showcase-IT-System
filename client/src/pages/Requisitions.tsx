import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
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

// Translated from requisitions.php + createRequisition.php. Rebuilt on the shared
// Card/PageHeader/DataTable primitives as part of the full-app redesign sweep (see
// MIGRATION_PLAN.md §10.11).
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
          />
        </div>
      </div>
    </div>
  )
}
