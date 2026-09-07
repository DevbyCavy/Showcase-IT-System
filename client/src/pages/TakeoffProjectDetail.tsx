import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as takeoffProjectsApi from '@/api/takeoffProjects'
import type { TakeoffDesignStatus, TakeoffDesignSummary } from '@/api/takeoffProjects'

const STATUS_STYLES: Record<TakeoffDesignStatus, string> = {
  Pending: 'bg-amber-500',
  Processing: 'bg-amber-500',
  NeedsInput: 'bg-blue-500',
  Ready: 'bg-green-600',
  Failed: 'bg-destructive',
}

function isTerminal(status: TakeoffDesignStatus) {
  return status === 'Ready' || status === 'Failed'
}

// NeedsInput has something to see (provisional items + open questions to answer), unlike
// Pending/Processing which have nothing yet — so it's clickable even though it isn't terminal.
function hasReviewPage(status: TakeoffDesignStatus) {
  return status !== 'Pending' && status !== 'Processing'
}

export default function TakeoffProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: project, isLoading } = useQuery({
    queryKey: ['takeoffProjects', projectId],
    queryFn: () => takeoffProjectsApi.getOne(projectId),
    // Poll while any design in the project is still Pending/Processing — mirrors BOQ.tsx's
    // near-real-time poll convention. Stops once every design has reached a terminal status.
    refetchInterval: (query) => (query.state.data?.designs.some((d) => !isTerminal(d.status)) ? 15000 : false),
  })

  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Please choose a design file.')
      return takeoffProjectsApi.uploadDesign(projectId, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takeoffProjects', projectId] })
      setFile(null)
      setError(null)
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to upload design') : (err as Error).message)
    },
  })

  const columns: DataTableColumn<TakeoffDesignSummary>[] = [
    {
      key: 'originalFilename',
      header: 'File',
      render: (d) => (
        <button
          type="button"
          className="text-brand-orange font-medium underline-offset-2 hover:underline"
          onClick={() => navigate(`/takeoff-projects/${projectId}/designs/${d.id}`)}
          disabled={!hasReviewPage(d.status)}
        >
          {d.originalFilename}
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${STATUS_STYLES[d.status]}`}>{d.status}</span>
      ),
    },
    { key: 'pdfType', header: 'PDF Type', render: (d) => d.pdfType ?? <span className="text-muted-foreground">—</span> },
    { key: 'uploadedAt', header: 'Uploaded', render: (d) => new Date(d.uploadedAt).toLocaleString() },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title={project?.name ?? 'Project'} subtitle={project?.clientName ?? undefined} />

      <Card className="mb-8">
        <CardContent className="space-y-3">
          {error && <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</div>}

          <div className="space-y-1">
            <label className="text-sm font-medium">Design File</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="border-input w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-muted-foreground text-xs">
              A labeled CAD-style PDF, a purely visual render (PDF or a plain photo/JPEG/PNG), or a mix — all pages/views in one file are
              treated as one design. If anything's missing or unclear, you'll be asked before the BOQ is finalized.
            </p>
          </div>

          <Button className="w-full" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !file}>
            <Upload className="mr-1.5 h-4 w-4" />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload & Extract'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Uploaded Designs</h2>
      <DataTable
        columns={columns}
        data={project?.designs ?? []}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
        emptyMessage="No designs uploaded yet."
      />
    </div>
  )
}
