import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import * as inventoryApi from '@/api/inventory'
import * as productsApi from '@/api/products'
import type { Product } from '@/api/products'

// Translated from store.php + custom/js/issuedProduct.js. Note: the legacy JS bound two separate
// submit handlers to the issue form (one unvalidated, one validated) that both fired on every
// submit, double-deducting stock — this version has exactly one issue path (see inventory.service.ts).
export default function Store() {
  const queryClient = useQueryClient()
  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: inventoryApi.listAvailableProducts,
  })
  const [search, setSearch] = useState('')
  const [issuing, setIssuing] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    if (!products) return []
    const q = search.toLowerCase()
    if (!q) return products
    return products.filter((p) => [p.name, p.brand.name, p.category.name].join(' ').toLowerCase().includes(q))
  }, [products, search])

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => productsApi.updateQuantity(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] }),
  })

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader
        title="Store"
        action={
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full pl-9" />
          </div>
        }
      />

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && filtered.length === 0 && <p className="text-muted-foreground">No products found.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-2 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-xs">No Image</span>
              )}
            </div>
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-muted-foreground text-xs">Brand: {p.brand.name}</p>
            <p className="text-muted-foreground text-xs">Category: {p.category.name}</p>
            <p className="text-muted-foreground text-xs">Status: Available</p>
            <p className="text-sm">
              Quantity: <span className="font-medium">{p.quantity}</span>
            </p>

            <div className="mt-auto flex justify-between pt-2">
              <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => setIssuing(p)}>
                −
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-green-600 text-green-600"
                onClick={() => adjustMutation.mutate({ id: p.id, quantity: p.quantity + 1 })}
              >
                +
              </Button>
            </div>
          </div>
        ))}
      </div>

      {issuing && <IssueProductModal product={issuing} onClose={() => setIssuing(null)} />}
    </div>
  )
}

function IssueProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    dateOfCollection: '',
    collectorName: '',
    quantityIssued: '',
    jobName: '',
    dateOfReturn: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.issueProduct({
        productId: product.id,
        dateOfCollection: form.dateOfCollection,
        collectorName: form.collectorName,
        toolName: product.name,
        quantityIssued: Number(form.quantityIssued),
        jobName: form.jobName,
        dateOfReturn: form.dateOfReturn || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] })
      setSuccess(true)
      setTimeout(onClose, 1500)
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to issue product') : 'Failed to issue product')
    },
  })

  const isValid =
    form.dateOfCollection.trim() !== '' &&
    form.collectorName.trim() !== '' &&
    form.quantityIssued.trim() !== '' &&
    Number(form.quantityIssued) >= 1 &&
    form.jobName.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Issue Product</h2>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {success && <div className="mb-3 rounded-md bg-primary/10 px-3 py-2 text-sm">Product issued successfully!</div>}

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Date of Collection</label>
            <Input
              type="date"
              value={form.dateOfCollection}
              onChange={(e) => setForm({ ...form, dateOfCollection: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Name of Collector</label>
            <Input value={form.collectorName} onChange={(e) => setForm({ ...form, collectorName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Product</label>
            <Input value={product.name} readOnly disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min={1}
              value={form.quantityIssued}
              onChange={(e) => setForm({ ...form, quantityIssued: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Job Name</label>
            <Input value={form.jobName} onChange={(e) => setForm({ ...form, jobName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Date of Return <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              type="date"
              value={form.dateOfReturn}
              onChange={(e) => setForm({ ...form, dateOfReturn: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Record'}
          </Button>
        </div>
      </div>
    </div>
  )
}
