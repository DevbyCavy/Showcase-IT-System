import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as memosApi from '@/api/memos'
import type { Memo } from '@/api/memos'

// Translated from memos.php + createMemo.php/updateMemoStatus.php/deleteMemo.php — the personal
// to-do list part of the Marketer Memos feature (scoped from feature/marketer-memos; the due-date
// reminder popup/acknowledge flow is out of scope, see MIGRATION_PLAN.md §10.7). Legacy gated this
// to Marketer, a role dropped in Module 2's normalization — open to any authenticated user here.
// Rebuilt on the shared Card/PageHeader/DataTable primitives as part of the full-app redesign
// sweep (see MIGRATION_PLAN.md §10.11).
export default function Memos() {
  const queryClient = useQueryClient()
  const { data: memos } = useQuery({ queryKey: ['memos'], queryFn: memosApi.list })
  const [search, setSearch] = useState('')

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['memos'] })

  const createMutation = useMutation({
    mutationFn: () => memosApi.create({ title, description: description || undefined, dueDate }),
    onSuccess: (memo) => {
      invalidate()
      setSuccess(`Memo "${memo.title}" saved!`)
      setTitle('')
      setDueDate('')
      setDescription('')
      setError(null)
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to save memo') : 'Failed to save memo')
    },
  })

  const doneMutation = useMutation({ mutationFn: (id: number) => memosApi.markDone(id), onSuccess: invalidate })
  const removeMutation = useMutation({ mutationFn: (id: number) => memosApi.remove(id), onSuccess: invalidate })

  const filtered = (memos ?? []).filter((m) => [m.title, m.description ?? ''].join(' ').toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<Memo>[] = [
    { key: 'title', header: 'Title', render: (m) => <span className="font-medium">{m.title}</span> },
    {
      key: 'due',
      header: 'Due',
      render: (m) => {
        const isOverdue = m.status === 'Pending' && new Date(m.dueDate) < new Date()
        return (
          <span className={isOverdue ? 'font-bold text-destructive' : ''}>
            {new Date(m.dueDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        )
      },
    },
    { key: 'notes', header: 'Notes', render: (m) => <span className="text-muted-foreground">{m.description}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${m.status === 'Done' ? 'bg-green-600 text-white' : 'bg-secondary text-foreground'}`}>
          {m.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (m) => (
        <div className="flex justify-center gap-1.5">
          {m.status === 'Pending' && (
            <Button size="sm" variant="outline" title="Mark Done" onClick={() => doneMutation.mutate(m.id)}>
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            title="Delete"
            onClick={() => removeMutation.mutate(m.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Memos" />

      <Card className="mb-8">
        <CardContent className="space-y-3">
          <h2 className="font-semibold">New Memo</h2>

          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow up with printer on delivery" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Due Date <span className="text-destructive">*</span>
              </label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra detail for yourself."
            />
          </div>

          <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title.trim() || !dueDate}>
            {createMutation.isPending ? 'Saving…' : 'Save Memo'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">My Memos</h2>
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(m) => m.id}
        search={search}
        onSearchChange={setSearch}
        emptyMessage="No memos yet."
      />
    </div>
  )
}
