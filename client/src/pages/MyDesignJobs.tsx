import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as designJobsApi from '@/api/designJobs'
import type { DesignJob } from '@/api/designJobs'

// Designer-facing counterpart to Assign Design Job (client/src/pages/AssignDesignJob.tsx) — lists
// jobs assigned to the current Graphic Designer (server already scopes the list to their own jobs,
// see designJob.service.ts#list), with the sample file and a Submit Completed Work form (requires
// attaching the finished design — png/jpg/jpeg/pdf — before the job can flip to Done). See
// MIGRATION_PLAN.md §22.
export default function MyDesignJobs() {
  const { data: designJobs, isLoading } = useQuery({ queryKey: ['designJobs'], queryFn: designJobsApi.list })
  const [submittingFor, setSubmittingFor] = useState<DesignJob | null>(null)

  const columns: DataTableColumn<DesignJob>[] = [
    { key: 'title', header: 'Title', render: (j) => <span className="font-medium">{j.title}</span> },
    { key: 'type', header: 'Type', render: (j) => (j.jobType === 'ThreeDDesign' ? '3D Design' : 'Artwork') },
    { key: 'from', header: 'Assigned By', render: (j) => `${j.assignedBy.name} ${j.assignedBy.surname}` },
    { key: 'deadline', header: 'Deadline', render: (j) => new Date(j.deadline).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
    { key: 'description', header: 'Description', render: (j) => (j.description ? <span className="line-clamp-2 max-w-xs text-sm">{j.description}</span> : '—') },
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
      key: 'actions',
      header: 'Actions',
      render: (j) =>
        j.status === 'Pending' ? (
          <Button size="sm" onClick={() => setSubmittingFor(j)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Submit Completed Work
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader title="My Design Jobs" />
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <DataTable columns={columns} data={designJobs ?? []} keyExtractor={(j) => j.id} emptyMessage="No design jobs assigned to you yet." />

      {submittingFor && <SubmitCompletedWorkModal job={submittingFor} onClose={() => setSubmittingFor(null)} />}
    </div>
  )
}

function SubmitCompletedWorkModal({ job, onClose }: { job: DesignJob; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Please attach your completed design.')
      return designJobsApi.markDone(job.id, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designJobs'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to submit completed work.') : (err as Error).message)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-lg font-semibold">Submit Completed Work</h2>
        <p className="text-muted-foreground mb-4 text-sm">{job.title}</p>

        {error && <div className="bg-destructive/10 text-destructive mb-3 rounded-md px-3 py-2 text-sm">{error}</div>}

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Completed Design <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,.pdf"
            className="border-input w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-muted-foreground text-xs">PNG, JPEG, or PDF.</p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}
