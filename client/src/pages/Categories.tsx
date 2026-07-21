import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as categoriesApi from '@/api/categories'
import type { Category, CategoryInput } from '@/api/categories'

// Translated from categories.php + custom/categories.js (DataTables -> TanStack Table).
export default function Categories() {
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const [globalFilter, setGlobalFilter] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; category: Category } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      { header: 'Category Name', accessorKey: 'name' },
      {
        header: 'Status',
        accessorKey: 'isActive',
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">Available</span>
          ) : (
            <span className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
              Not Available
            </span>
          ),
      },
      {
        id: 'options',
        header: 'Options',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setModal({ mode: 'edit', category: row.original })}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm('Do you really want to remove this category?')) {
                  deleteMutation.mutate(row.original.id)
                }
              }}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation],
  )

  const table = useReactTable({
    data: categories ?? [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Manage Categories</h1>
        <Button onClick={() => setModal({ mode: 'add' })}>Add Category</Button>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="p-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-muted-foreground">
                  No categories found.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <CategoryModal modal={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

function CategoryModal({
  modal,
  onClose,
}: {
  modal: { mode: 'add' } | { mode: 'edit'; category: Category }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const existing = modal.mode === 'edit' ? modal.category : null
  const [form, setForm] = useState<CategoryInput>({
    name: existing?.name ?? '',
    isActive: existing?.isActive ?? true,
  })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      modal.mode === 'add' ? categoriesApi.create(form) : categoriesApi.update(modal.category.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Save failed') : 'Save failed')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{modal.mode === 'add' ? 'Add Category' : 'Edit Category'}</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
