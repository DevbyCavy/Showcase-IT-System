import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import * as boqApi from '@/api/boq'
import * as ordersApi from '@/api/orders'
import type { Boq, BoqItemInput } from '@/api/boq'

const emptyItem: BoqItemInput = { productName: '', description: '', unit: '', quantity: 0 }

// Translated from createBOQ.php + downloadBOQ.php (scoped from feature/boq-stock-requisitions per
// MIGRATION_PLAN.md §2.1). Order select auto-fills location, matching the legacy's inline JS.
// Rebuilt on the shared Card/PageHeader/DataTable primitives as part of the full-app redesign
// sweep (see MIGRATION_PLAN.md §10.11).
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
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item)))
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
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Bill Of Quantities" />

      <Card className="mb-8">
        <CardContent className="space-y-3">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <label className="text-sm font-medium">Items</label>
            <div className="overflow-x-auto rounded-xl border">
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
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Saved Bills Of Quantities</h2>
      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}
      <DataTable columns={columns} data={boqs ?? []} keyExtractor={(b) => b.id} emptyMessage="No BOQs saved yet." />
    </div>
  )
}
