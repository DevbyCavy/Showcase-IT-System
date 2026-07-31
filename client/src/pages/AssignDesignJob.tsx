import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Send, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as designJobsApi from '@/api/designJobs'
import * as usersApi from '@/api/users'
import type { DesignJob, DesignJobType } from '@/api/designJobs'

const JOB_TYPE_OPTIONS: { value: DesignJobType; label: string }[] = [
  { value: 'Artwork', label: 'Artwork' },
  { value: 'ThreeDDesign', label: '3D Design' },
]

// New feature: Marketer (+ Super Admin) assigns a design job — Artwork or 3D Design — to a
// Graphic Designer, with an optional sample reference file and a required deadline. Standalone,
// not tied to an Order (Calvin's explicit choice) — see MIGRATION_PLAN.md §22.
export default function AssignDesignJob() {
  const queryClient = useQueryClient()
  const { data: designJobs } = useQuery({ queryKey: ['designJobs'], queryFn: designJobsApi.list })
  const { data: users } = useQuery({ queryKey: ['users', 'assignable'], queryFn: usersApi.listAssignable })
  const designers = (users ?? []).filter((u) => u.role === 'GraphicDesigner')

  const [title, setTitle] = useState('')
  const [jobType, setJobType] = useState<DesignJobType>('Artwork')
  const [assignedToId, setAssignedToId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')
  const [sampleFile, setSampleFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!assignedToId) throw new Error('Please choose a designer.')
      if (!deadline) throw new Error('Please set a deadline.')
      return designJobsApi.create({
        title,
        jobType,
        assignedToId: Number(assignedToId),
        deadline,
        description: description.trim() || undefined,
        sampleFile: sampleFile ?? undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designJobs'] })
      setSuccess('Design job assigned!')
      setError(null)
      setTitle('')
      setJobType('Artwork')
      setAssignedToId('')
      setDeadline('')
      setDescription('')
      setSampleFile(null)
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to assign design job') : (err as Error).message)
      setSuccess(null)
    },
  })

  const columns: DataTableColumn<DesignJob>[] = [
    { key: 'title', header: 'Title', render: (j) => <span className="font-medium">{j.title}</span> },
    { key: 'type', header: 'Type', render: (j) => (j.jobType === 'ThreeDDesign' ? '3D Design' : 'Artwork') },
    { key: 'designer', header: 'Designer', render: (j) => `${j.assignedTo.name} ${j.assignedTo.surname}` },
    { key: 'deadline', header: 'Deadline', render: (j) => new Date(j.deadline).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
    {
      key: 'status',
      header: 'Status',
      render: (j) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${j.status === 'Done' ? 'bg-green-600' : 'bg-amber-500'}`}>
          {j.status}
        </span>
      ),
    },
    {
      key: 'sample',
      header: 'Sample',
      render: (j) =>
        j.sampleFile ? (
          <a href={j.sampleFile} target="_blank" rel="noreferrer" className="text-brand-orange inline-flex items-center gap-1 text-sm underline">
            <FileText className="h-3.5 w-3.5" /> View
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        ),
    },
    {
      key: 'completed',
      header: 'Completed Work',
      render: (j) =>
        j.completedFile ? (
          <a href={j.completedFile} target="_blank" rel="noreferrer" className="text-brand-orange inline-flex items-center gap-1 text-sm underline">
            <FileText className="h-3.5 w-3.5" /> View
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Assign Design Job" />

      <Card className="mb-8">
        <CardContent className="space-y-3">
          {error && <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</div>}
          {success && <div className="bg-primary/10 rounded-md px-3 py-2 text-sm">{success}</div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Job Title <span className="text-destructive">*</span>
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Storefront signage artwork" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Job Type <span className="text-destructive">*</span>
              </label>
              <select
                className="border-input flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                value={jobType}
                onChange={(e) => setJobType(e.target.value as DesignJobType)}
              >
                {JOB_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Assign To <span className="text-destructive">*</span>
              </label>
              <select
                className="border-input flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Select a designer...</option>
                {designers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.surname}
                  </option>
                ))}
              </select>
              {designers.length === 0 && <p className="text-muted-foreground text-xs">No Graphic Designer accounts exist yet.</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Deadline <span className="text-destructive">*</span>
              </label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Design Description</label>
            <textarea
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — briefing notes, sizing, colors, anything the designer needs to know."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Sample Design File</label>
            <input
              type="file"
              accept="image/png,image/jpeg,.pdf"
              className="border-input w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
              onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-muted-foreground text-xs">Optional — a reference image or PDF (PNG, JPEG, or PDF).</p>
          </div>

          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            <Send className="mr-1.5 h-4 w-4" />
            {mutation.isPending ? 'Assigning…' : 'Assign Job'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Assigned Design Jobs</h2>
      <DataTable columns={columns} data={designJobs ?? []} keyExtractor={(j) => j.id} emptyMessage="No design jobs assigned yet." />
    </div>
  )
}
