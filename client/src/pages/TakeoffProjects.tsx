import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as takeoffProjectsApi from '@/api/takeoffProjects'
import type { TakeoffProject } from '@/api/takeoffProjects'

// AI Takeoff / BOQ Generator — new feature, additive alongside the existing manual BOQ page
// (client/src/pages/BOQ.tsx). Single-owner projects (no team sharing in v0.1), each holding
// design PDF uploads whose review happens on TakeoffProjectDetail.tsx / TakeoffDesignReview.tsx.
export default function TakeoffProjects() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: projects, isLoading } = useQuery({ queryKey: ['takeoffProjects'], queryFn: takeoffProjectsApi.list })

  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => takeoffProjectsApi.create({ name, clientName: clientName.trim() || undefined }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['takeoffProjects'] })
      setName('')
      setClientName('')
      setError(null)
      navigate(`/takeoff-projects/${project.id}`)
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to create project') : 'Failed to create project')
    },
  })

  const columns: DataTableColumn<TakeoffProject>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <button
          type="button"
          className="text-brand-orange font-medium underline-offset-2 hover:underline"
          onClick={() => navigate(`/takeoff-projects/${p.id}`)}
        >
          {p.name}
        </button>
      ),
    },
    { key: 'clientName', header: 'Client', render: (p) => p.clientName ?? <span className="text-muted-foreground">—</span> },
    { key: 'designCount', header: 'Designs', render: (p) => p.designCount },
    { key: 'createdAt', header: 'Created', render: (p) => new Date(p.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="AI Takeoff" subtitle="Upload a design PDF and get a draft Bill of Quantities to review." />

      <Card className="mb-8">
        <CardContent className="space-y-3">
          {error && <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Project Name <span className="text-destructive">*</span>
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Trade Show Stand" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Client Name <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
          </div>

          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}>
            <Send className="mr-1.5 h-4 w-4" />
            {mutation.isPending ? 'Creating…' : 'Create Project'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Your Projects</h2>
      <DataTable
        columns={columns}
        data={projects ?? []}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No projects yet — create one above."
      />
    </div>
  )
}
