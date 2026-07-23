import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as memosApi from '@/api/memos'

// Translated from memos.php + createMemo.php/updateMemoStatus.php/deleteMemo.php — the personal
// to-do list part of the Marketer Memos feature (scoped from feature/marketer-memos; the due-date
// reminder popup/acknowledge flow is out of scope, see MIGRATION_PLAN.md §10.7). Legacy gated this
// to Marketer, a role dropped in Module 2's normalization — open to any authenticated user here.
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

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold">Memos</h1>

      <div className="mb-8 space-y-3 rounded-lg border bg-card p-4 shadow-sm">
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

        <Button
          className="w-full"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !title.trim() || !dueDate}
        >
          {createMutation.isPending ? 'Saving…' : 'Save Memo'}
        </Button>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">My Memos</h2>
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[160px]" />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Due</th>
              <th className="p-3">Notes</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No memos yet.
                </td>
              </tr>
            )}
            {filtered.map((m) => {
              const isOverdue = m.status === 'Pending' && new Date(m.dueDate) < new Date()
              return (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-medium">{m.title}</td>
                  <td className={`p-3 ${isOverdue ? 'font-bold text-destructive' : ''}`}>
                    {new Date(m.dueDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="text-muted-foreground p-3">{m.description}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${m.status === 'Done' ? 'bg-green-600 text-white' : 'bg-secondary text-foreground'}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
