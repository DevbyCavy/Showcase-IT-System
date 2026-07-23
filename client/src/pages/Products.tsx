import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as productsApi from '@/api/products'
import type { Product } from '@/api/products'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Translated from product.php + custom/js/product.js (DataTables -> TanStack Table -> the shared
// DataTable primitive, see MIGRATION_PLAN.md §10.11). Image upload replaces move_uploaded_file()
// with Multer on the server side.
export default function Products() {
  const queryClient = useQueryClient()
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: productsApi.list })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; product: Product } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const filtered = (products ?? []).filter((p) =>
    [p.name, p.brand.name, p.category.name].join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'image',
      header: 'Image',
      render: (p) =>
        p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="h-8 w-12 rounded object-cover" />
        ) : (
          <span className="text-muted-foreground text-xs">No Image</span>
        ),
    },
    { key: 'name', header: 'Product Name', render: (p) => p.name },
    { key: 'rate', header: 'Amnt/Size(mm/ml/kg)', render: (p) => p.rate },
    { key: 'quantity', header: 'Quantity', render: (p) => p.quantity },
    { key: 'brand', header: 'Brand', render: (p) => p.brand.name },
    { key: 'category', header: 'Category', render: (p) => p.category.name },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        p.isActive ? (
          <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">Available</span>
        ) : (
          <span className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">Not Available</span>
        ),
    },
    {
      key: 'options',
      header: 'Options',
      render: (p) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setModal({ mode: 'edit', product: p })}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm('Do you really want to remove this product?')) {
                deleteMutation.mutate(p.id)
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
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader title="Manage Product" action={<Button onClick={() => setModal({ mode: 'add' })}>Add Product</Button>} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        emptyMessage="No products found."
      />

      {modal?.mode === 'add' && <AddProductModal onClose={() => setModal(null)} />}
      {modal?.mode === 'edit' && <EditProductModal product={modal.product} onClose={() => setModal(null)} />}
    </div>
  )
}

function BrandCategorySelects({
  brandId,
  categoryId,
  onChange,
}: {
  brandId: string
  categoryId: string
  onChange: (field: 'brandId' | 'categoryId', value: string) => void
}) {
  const { data: options } = useQuery({ queryKey: ['products', 'form-options'], queryFn: productsApi.formOptions })

  return (
    <>
      <div className="space-y-1">
        <label className="text-sm font-medium">Brand Name</label>
        <select className={selectClass} value={brandId} onChange={(e) => onChange('brandId', e.target.value)}>
          <option value="">SELECT</option>
          {options?.brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Category Name</label>
        <select className={selectClass} value={categoryId} onChange={(e) => onChange('categoryId', e.target.value)}>
          <option value="">SELECT</option>
          {options?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    rate: '',
    brandId: '',
    categoryId: '',
    isActive: true,
  })
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!image) throw new Error('Product Image field is required')
      return productsApi.create({ ...form, image })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Save failed') : (err as Error).message)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Add Product</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Image</label>
            <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Quantity</label>
            <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Amnt/Size(mm/ml/kg)</label>
            <Input value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </div>
          <BrandCategorySelects
            brandId={form.brandId}
            categoryId={form.categoryId}
            onChange={(field, value) => setForm({ ...form, [field]: value })}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              className={selectClass}
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
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [tab, setTab] = useState<'photo' | 'info'>('photo')
  const queryClient = useQueryClient()

  const [image, setImage] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const imageMutation = useMutation({
    mutationFn: () => {
      if (!image) throw new Error('Please select an image to upload.')
      return productsApi.updateImage(product.id, image)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    onError: (err) => setImageError(isAxiosError(err) ? (err.response?.data?.error ?? 'Upload failed') : (err as Error).message),
  })

  const [form, setForm] = useState({
    name: product.name,
    quantity: String(product.quantity),
    rate: product.rate,
    brandId: String(product.brandId),
    categoryId: String(product.categoryId),
    isActive: product.isActive,
  })
  const [infoError, setInfoError] = useState<string | null>(null)
  const infoMutation = useMutation({
    mutationFn: () =>
      productsApi.update(product.id, {
        name: form.name,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
        brandId: Number(form.brandId),
        categoryId: Number(form.categoryId),
        isActive: form.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: (err) => setInfoError(isAxiosError(err) ? (err.response?.data?.error ?? 'Update failed') : 'Update failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Edit Product</h2>

        <div className="mb-4 flex gap-2 border-b">
          <button
            className={`px-3 py-2 text-sm font-medium ${tab === 'photo' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('photo')}
          >
            Photo
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${tab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('info')}
          >
            Product Info
          </button>
        </div>

        {tab === 'photo' && (
          <div className="space-y-3">
            {imageError && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{imageError}</div>}
            <div className="space-y-1">
              <label className="text-sm font-medium">Current Image</label>
              <div>
                <img src={product.imageUrl} alt={product.name} className="h-32 w-32 rounded border object-cover" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Upload New Image</label>
              <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => imageMutation.mutate()} disabled={imageMutation.isPending}>
                {imageMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-3">
            {infoError && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{infoError}</div>}
            <div className="space-y-1">
              <label className="text-sm font-medium">Product Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Quantity</label>
              <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Amnt/Size(mm/ml/kg)</label>
              <Input value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </div>
            <BrandCategorySelects
              brandId={form.brandId}
              categoryId={form.categoryId}
              onChange={(field, value) => setForm({ ...form, [field]: value })}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                className={selectClass}
                value={form.isActive ? '1' : '2'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}
              >
                <option value="1">Available</option>
                <option value="2">Not Available</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => infoMutation.mutate()} disabled={infoMutation.isPending}>
                {infoMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
