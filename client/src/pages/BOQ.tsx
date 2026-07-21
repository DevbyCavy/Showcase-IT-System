import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as boqApi from '@/api/boq'
import * as ordersApi from '@/api/orders'
import type { BoqItemInput } from '@/api/boq'

const emptyItem: BoqItemInput = { productName: '', description: '', unit: '', quantity: 0 }

// Translated from createBOQ.php + downloadBOQ.php (scoped from feature/boq-stock-requisitions
// per MIGRATION_PLAN.md §2.1). Order select auto-fills location, matching the legacy's inline JS.
export default function BOQ() {
  const queryClient = useQueryClient()
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const { data: boqs } = useQuery({ queryKey: ['boqs'], queryFn: boqApi.list })

  const [orderId, setOrderId] = useState('')
  const [eventName, setEventName] = useState('')
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [items, setItems] = useState<BoqItemInput[]>([{ ...emptyItem }])
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
    onSuccess: (boq) => {
      queryClient.invalidateQueries({ queryKey: ['boqs'] })
      setSuccess(`BOQ #${boq.boqNumber} saved successfully!`)
      setEventName('')
      setClientName('')
      setItems([{ ...emptyItem }])
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

  function updateItem(index: number, field: keyof BoqItemInput, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item)),
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

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold">Bill Of Quantities</h1>

      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

        <div className="space-y-1">
          <label className="text-sm font-medium">Order</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Items</label>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1">
                      <Input value={item.productName} onChange={(e) => updateItem(i, 'productName', e.target.value)} />
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
                        onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}>
            + Add Item
          </Button>
        </div>

        <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save BOQ'}
        </Button>
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Saved Bills Of Quantities</h2>
      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}
      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">BOQ #</th>
              <th className="p-3">Order #</th>
              <th className="p-3">Event</th>
              <th className="p-3">Client</th>
              <th className="p-3">Location</th>
              <th className="p-3">Date Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(boqs ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No BOQs saved yet
                </td>
              </tr>
            )}
            {boqs?.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">{b.boqNumber}</td>
                <td className="p-3">{b.orderNumber}</td>
                <td className="p-3">{b.eventName}</td>
                <td className="p-3">{b.clientName}</td>
                <td className="p-3">{b.location}</td>
                <td className="p-3">{new Date(b.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(b.id, b.boqNumber)}>
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
