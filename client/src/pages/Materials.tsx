import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as materialSpecsApi from '@/api/materialSpecs'
import type { MaterialSpec, MaterialSpecInput } from '@/api/materialSpecs'

const emptyForm: MaterialSpecInput = {
  name: '',
  unit: 'm2',
  standardSheetWmm: null,
  standardSheetHmm: null,
  typicalThicknessMm: [],
  standardLengthsMm: [],
  wasteFactor: 1.1,
  unitCost: null,
}

// Reference table backing the AI Takeoff / BOQ Generator's Path A material matching (see
// TakeoffProjects.tsx) — doesn't fit the generic SimpleCatalogManager shape (name + isActive
// only), so this is a bespoke list+modal page following the same pattern by hand.
export default function Materials() {
  const queryClient = useQueryClient()
  const { data: materials, isLoading } = useQuery({ queryKey: ['materialSpecs'], queryFn: materialSpecsApi.list })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; item: MaterialSpec } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materialSpecsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materialSpecs'] }),
  })

  const filtered = (materials ?? []).filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<MaterialSpec>[] = [
    { key: 'name', header: 'Material', render: (m) => <span className="font-medium">{m.name}</span> },
    { key: 'unit', header: 'Unit', render: (m) => m.unit },
    {
      key: 'sheetSize',
      header: 'Standard Sheet',
      render: (m) => (m.standardSheetWmm && m.standardSheetHmm ? `${Number(m.standardSheetWmm)} × ${Number(m.standardSheetHmm)}mm` : '—'),
    },
    { key: 'thickness', header: 'Thickness (mm)', render: (m) => m.typicalThicknessMm.join(', ') || '—' },
    { key: 'lengths', header: 'Std. Lengths (mm)', render: (m) => m.standardLengthsMm.join(', ') || '—' },
    { key: 'wasteFactor', header: 'Waste Factor', render: (m) => Number(m.wasteFactor).toFixed(2) },
    {
      key: 'options',
      header: 'Options',
      render: (m) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', item: m })}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Remove ${m.name}?`)) deleteMutation.mutate(m.id)
            }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader
        title="Materials"
        subtitle="Reference table used by AI Takeoff's material matching."
        action={<Button onClick={() => setModal({ mode: 'add' })}>Add Material</Button>}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(m) => m.id}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        emptyMessage="No materials found."
      />

      {modal && <MaterialModal modal={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

function numberListInput(value: number[], onChange: (next: number[]) => void, placeholder: string) {
  return (
    <Input
      value={value.join(', ')}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n) && n > 0),
        )
      }
    />
  )
}

function MaterialModal({ modal, onClose }: { modal: { mode: 'add' } | { mode: 'edit'; item: MaterialSpec }; onClose: () => void }) {
  const queryClient = useQueryClient()
  const existing = modal.mode === 'edit' ? modal.item : null
  const [form, setForm] = useState<MaterialSpecInput>(
    existing
      ? {
          name: existing.name,
          unit: existing.unit,
          standardSheetWmm: existing.standardSheetWmm ? Number(existing.standardSheetWmm) : null,
          standardSheetHmm: existing.standardSheetHmm ? Number(existing.standardSheetHmm) : null,
          typicalThicknessMm: existing.typicalThicknessMm,
          standardLengthsMm: existing.standardLengthsMm,
          wasteFactor: Number(existing.wasteFactor),
          unitCost: existing.unitCost ? Number(existing.unitCost) : null,
        }
      : emptyForm,
  )
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => (modal.mode === 'add' ? materialSpecsApi.create(form) : materialSpecsApi.update(modal.item.id, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialSpecs'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Save failed') : 'Save failed')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{modal.mode === 'add' ? 'Add Material' : 'Edit Material'}</h2>

        {error && <div className="bg-destructive/10 text-destructive mb-3 rounded-md px-3 py-2 text-sm">{error}</div>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Unit</label>
              <select
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="m2">m2</option>
                <option value="linear_m">linear_m</option>
                <option value="each">each</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Standard Sheet W (mm)</label>
              <Input
                type="number"
                value={form.standardSheetWmm ?? ''}
                onChange={(e) => setForm({ ...form, standardSheetWmm: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Standard Sheet H (mm)</label>
              <Input
                type="number"
                value={form.standardSheetHmm ?? ''}
                onChange={(e) => setForm({ ...form, standardSheetHmm: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Typical Thickness (mm, comma-separated)</label>
            {numberListInput(form.typicalThicknessMm, (v) => setForm({ ...form, typicalThicknessMm: v }), 'e.g. 12, 16, 18')}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Standard Lengths (mm, comma-separated)</label>
            {numberListInput(form.standardLengthsMm, (v) => setForm({ ...form, standardLengthsMm: v }), 'e.g. 1800, 2400, 3000')}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Waste Factor</label>
            <Input
              type="number"
              step="0.01"
              min="1"
              value={form.wasteFactor}
              onChange={(e) => setForm({ ...form, wasteFactor: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name.trim()}>
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
