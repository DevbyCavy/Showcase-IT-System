import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FileDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as boqApi from '@/api/boq'
import * as ordersApi from '@/api/orders'
import * as productsApi from '@/api/products'
import type { Boq, BoqItemInput } from '@/api/boq'
import type { Product } from '@/api/products'

const emptyItem: BoqItemInput = { productId: 0, description: '', unit: '', quantity: 0 }

// Translated from createBOQ.php + downloadBOQ.php (scoped from feature/boq-stock-requisitions per
// MIGRATION_PLAN.md §2.1). Order select auto-fills location, matching the legacy's inline JS.
// Rebuilt on the shared Card/PageHeader/DataTable primitives as part of the full-app redesign
// sweep (see MIGRATION_PLAN.md §10.11). Items were free-text until §29: each line now picks a
// real Product (deducted from Store stock on save, capped at what's available — any shortfall
// auto-files a Product requisition, per Calvin's explicit request), instead of typing any name.
// §29 first tried a plain <select> for the product picker; Calvin flagged that scrolling a long
// catalog to find one product doesn't scale, so it's now a type-to-search text field with a
// filtered suggestion dropdown instead (§31) — same underlying productId, just a faster way to
// land on it.
export default function BOQ() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.list })
  // Polled so a BOQ's items flip from "Shortfall" to "In Stock" live once a restock fulfills the
  // linked requisition (see product.repository.ts#fulfillShortfallsInTx, MIGRATION_PLAN.md §30) —
  // matches the app's other near-real-time polls.
  const { data: boqs } = useQuery({ queryKey: ['boqs'], queryFn: boqApi.list, refetchInterval: 15000 })

  const [orderId, setOrderId] = useState('')
  const [eventName, setEventName] = useState('')
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [items, setItems] = useState<BoqItemInput[]>([{ ...emptyItem }])
  // Parallel array (same indices as items) holding each row's typed product-search text — kept
  // separate from BoqItemInput since the API only needs productId, not a display string.
  const [itemSearches, setItemSearches] = useState<string[]>([''])
  const [openSearchIndex, setOpenSearchIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      boqApi.create({
        orderId: Number(orderId),
        eventName,
        clientName: clientName || undefined,
        location,
        items,
      }),
    onSuccess: ({ boq, shortfallCount }) => {
      queryClient.invalidateQueries({ queryKey: ['boqs'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      setSuccess(
        shortfallCount > 0
          ? `BOQ #${boq.boqNumber} saved. ${shortfallCount} item${shortfallCount > 1 ? 's were' : ' was'} short on stock — a requisition was filed automatically for the shortfall.`
          : `BOQ #${boq.boqNumber} saved successfully!`,
      )
      setEventName('')
      setClientName('')
      setItems([{ ...emptyItem }])
      setItemSearches([''])
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to save BOQ') : 'Failed to save BOQ')
    },
  })

  function handleOrderChange(id: string) {
    setOrderId(id)
    const order = orders?.find((o) => String(o.id) === id)
    if (order) setLocation(order.location)
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }])
    setItemSearches((prev) => [...prev, ''])
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
    setItemSearches((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  // Typing clears any previously matched productId — a row only counts as having a product once a
  // suggestion is actually clicked, so a half-typed/unmatched name can't accidentally submit
  // whatever was picked before.
  function setItemSearch(index: number, text: string) {
    setItemSearches((prev) => prev.map((s, i) => (i === index ? text : s)))
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, productId: 0 } : item)))
    setOpenSearchIndex(index)
  }

  function selectProduct(index: number, product: Product) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, productId: product.id } : item)))
    setItemSearches((prev) => prev.map((s, i) => (i === index ? product.name : s)))
    setOpenSearchIndex(null)
  }

  function updateItem(index: number, field: keyof BoqItemInput, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === 'quantity' || field === 'productId' ? Number(value) : value } : item)),
    )
  }

  async function handleDownload(id: number, boqNumber: string) {
    setDownloadError(null)
    try {
      await boqApi.downloadPdf(id, boqNumber)
    } catch {
      setDownloadError('Failed to download PDF.')
    }
  }

  const columns: DataTableColumn<Boq>[] = [
    { key: 'boqNumber', header: 'BOQ #', render: (b) => b.boqNumber },
    { key: 'orderNumber', header: 'Order #', render: (b) => b.orderNumber },
    { key: 'eventName', header: 'Event', render: (b) => b.eventName },
    { key: 'clientName', header: 'Client', render: (b) => b.clientName },
    { key: 'location', header: 'Location', render: (b) => b.location },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      render: (b) => {
        const fulfilled = b.items.filter((i) => i.status === 'Fulfilled').length
        const allFulfilled = fulfilled === b.items.length
        return (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${allFulfilled ? 'bg-green-600' : 'bg-destructive'}`}>
            {fulfilled}/{b.items.length} in stock
          </span>
        )
      },
    },
    { key: 'createdAt', header: 'Date Created', render: (b) => new Date(b.createdAt).toLocaleString() },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <Button size="sm" variant="outline" onClick={() => handleDownload(b.id, b.boqNumber)}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <PageHeader title="Bill Of Quantities" />

      <Card className="mb-8">
        <CardContent className="space-y-3">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Order</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={orderId}
                onChange={(e) => handleOrderChange(e.target.value)}
              >
                <option value="">-- Select Order --</option>
                {orders?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.orderName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name Of Event</label>
              <Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Client Name <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Items <span className="text-muted-foreground text-xs">— quantities are deducted from Store stock on save</span>
            </label>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2">In Stock</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Quantity</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const selectedProduct = products?.find((p) => p.id === item.productId)
                    const search = itemSearches[i] ?? ''
                    const matches = search.trim()
                      ? (products ?? []).filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
                      : []
                    return (
                      <tr key={i} className="border-t">
                        <td className="relative p-1">
                          <Input
                            value={search}
                            onChange={(e) => setItemSearch(i, e.target.value)}
                            onFocus={() => setOpenSearchIndex(i)}
                            onBlur={() => setTimeout(() => setOpenSearchIndex((idx) => (idx === i ? null : idx)), 150)}
                            placeholder="Type a product name..."
                          />
                          {openSearchIndex === i && search.trim() && (
                            <div className="bg-card absolute z-10 mt-1 max-h-48 w-56 overflow-y-auto rounded-md border shadow-lg">
                              {matches.length === 0 ? (
                                <div className="text-muted-foreground px-3 py-2 text-sm">No matching products.</div>
                              ) : (
                                matches.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="hover:bg-secondary flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                                    onMouseDown={() => selectProduct(i, p)}
                                  >
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-muted-foreground shrink-0 text-xs">{p.quantity} in stock</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-1 text-center">
                          {selectedProduct ? (
                            <span className={selectedProduct.quantity < item.quantity ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              {selectedProduct.quantity}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-1">
                          <Input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive"
                            onClick={() => removeItem(i)}
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addItem}>
              + Add Item
            </Button>
          </div>

          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save BOQ'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Saved Bills Of Quantities</h2>
      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}
      <DataTable columns={columns} data={boqs ?? []} keyExtractor={(b) => b.id} emptyMessage="No BOQs saved yet." />

      <Button
        size="icon"
        className="fixed right-4 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg lg:right-[416px]"
        onClick={() => navigate('/takeoff-projects')}
        title="Generate a BOQ with AI Takeoff"
        aria-label="Generate a BOQ with AI Takeoff"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  )
}
