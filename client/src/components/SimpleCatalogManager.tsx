import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'

export interface SimpleCatalogItem {
  id: number
  name: string
  isActive: boolean
}

export interface SimpleCatalogInput {
  name: string
  isActive: boolean
}

interface SimpleCatalogApi<T extends SimpleCatalogItem> {
  list: () => Promise<T[]>
  create: (input: SimpleCatalogInput) => Promise<T>
  update: (id: number, input: SimpleCatalogInput) => Promise<T>
  remove: (id: number) => Promise<unknown>
}

// Shared UI for the brand/category CRUD shape (identical in the legacy app: name + a soft-delete
// status + a business "Available" flag confusingly also called "Status" on the form). Used by
// Categories.tsx and Brands.tsx — extract further shared entities here rather than re-copying.
// Rebuilt on the shared PageHeader/DataTable primitives as part of the full-app redesign sweep
// (see MIGRATION_PLAN.md §10.11).
export function SimpleCatalogManager<T extends SimpleCatalogItem>({
  title,
  entityName,
  nameLabel,
  queryKey,
  api,
}: {
  title: string
  entityName: string
  nameLabel: string
  queryKey: string
  api: SimpleCatalogApi<T>
}) {
  const queryClient = useQueryClient()
  const { data: items, isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.list })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; item: T } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  })

  const filtered = (items ?? []).filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<T>[] = [
    { key: 'name', header: `${entityName} Name`, render: (item) => item.name },
    {
      key: 'status',
      header: 'Status',
      render: (item) =>
        item.isActive ? (
          <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">Available</span>
        ) : (
          <span className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">Not Available</span>
        ),
    },
    {
      key: 'options',
      header: 'Options',
      render: (item) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', item })}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Do you really want to remove this ${entityName.toLowerCase()}?`)) {
                deleteMutation.mutate(item.id)
              }
            }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title={title} action={<Button onClick={() => setModal({ mode: 'add' })}>Add {entityName}</Button>} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        emptyMessage={`No ${entityName.toLowerCase()}s found.`}
      />

      {modal && (
        <CatalogModal modal={modal} entityName={entityName} nameLabel={nameLabel} queryKey={queryKey} api={api} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

function CatalogModal<T extends SimpleCatalogItem>({
  modal,
  entityName,
  nameLabel,
  queryKey,
  api,
  onClose,
}: {
  modal: { mode: 'add' } | { mode: 'edit'; item: T }
  entityName: string
  nameLabel: string
  queryKey: string
  api: SimpleCatalogApi<T>
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const existing = modal.mode === 'edit' ? modal.item : null
  const [form, setForm] = useState<SimpleCatalogInput>({
    name: existing?.name ?? '',
    isActive: existing?.isActive ?? true,
  })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => (modal.mode === 'add' ? api.create(form) : api.update(modal.item.id, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Save failed') : 'Save failed')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{modal.mode === 'add' ? `Add ${entityName}` : `Edit ${entityName}`}</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{nameLabel}</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.isActive ? '1' : '2'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}
            >
              <option value="1">Available</option>
              <option value="2">Not Available</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
