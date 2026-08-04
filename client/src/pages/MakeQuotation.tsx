import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Send, FileDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { ToastStack, type ToastItem } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import * as quotationsApi from '@/api/quotations'
import type { Quotation, QuotationItemInput } from '@/api/quotations'

// Polling interval for the real-time "your quotation was approved" alert — matches the app's
// other near-real-time polls (Task Calendar, Tracking).
const POLL_INTERVAL_MS = 15000

const DEFAULT_TERMS = [
  '1. Invoice valid for 14 working days.',
  '2. Payment required before commencement.',
  '3. This is not a hire price but a hire purchase.',
  '4. Artwork must be confirmed no later than 14 days before the event.',
  '5. Artwork must be sent in high resolution PDF/EPS.',
  '6. Payable in USD.',
].join('\n')

const emptyItem: QuotationItemInput = { description: '', quantity: 1, unitPrice: 0 }

// Translated from makeQuotation.php + createQuotation.php (scoped from feature/work-log-sheet, see
// MIGRATION_PLAN.md §10). Legacy gated this to requireRole('Marketer'), a role already dropped in
// Module 2's normalization — submission is open to any authenticated role here instead.
export default function MakeQuotation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list, refetchInterval: POLL_INTERVAL_MS })

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set())
  const nextToastId = useRef(0)
  const prevStatusRef = useRef<Map<number, string> | null>(null)

  const myQuotations = (quotations ?? []).filter((q) => q.submittedBy.id === user?.id)

  // Real-time "your quotation was approved" alert: on every poll, compare each of my quotations'
  // status against what it was last poll. First run just records the baseline (a page load
  // shouldn't announce quotations that were already Approved before you opened the page) —
  // afterwards, a Pending -> Approved transition triggers a toast + a temporary row highlight.
  useEffect(() => {
    const currentStatus = new Map(myQuotations.map((q) => [q.id, q.status]))
    if (prevStatusRef.current) {
      const prev = prevStatusRef.current
      for (const q of myQuotations) {
        if (q.status === 'Approved' && prev.get(q.id) === 'Pending') {
          setToasts((t) => [...t, { id: nextToastId.current++, message: `Your quotation ${q.quotationNumber} was approved!`, tone: 'success' }])
          setHighlightedIds((h) => new Set(h).add(q.id))
          setTimeout(() => setHighlightedIds((h) => { const next = new Set(h); next.delete(q.id); return next }), 8000)
        }
      }
    }
    prevStatusRef.current = currentStatus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotations])

  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [termsConditions, setTermsConditions] = useState(DEFAULT_TERMS)
  const [items, setItems] = useState<QuotationItemInput[]>([{ ...emptyItem }])
  const [applyVat, setApplyVat] = useState(false)
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const VAT_RATE = 0.155
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const vatAmount = applyVat ? subtotal * VAT_RATE : 0
  const total = subtotal + vatAmount

  const mutation = useMutation({
    mutationFn: () =>
      quotationsApi.create(
        {
          customerName,
          customerId: customerId || undefined,
          projectName: projectName || undefined,
          orderNumber: orderNumber || undefined,
          quoteDate,
          termsConditions,
          applyVat,
          items: items.filter((i) => i.description.trim() !== ''),
        },
        designFile ?? undefined,
      ),
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      setSuccess(`Quotation ${quotation.quotationNumber} submitted for approval!`)
      setCustomerName('')
      setCustomerId('')
      setProjectName('')
      setOrderNumber('')
      setItems([{ ...emptyItem }])
      setApplyVat(false)
      setDesignFile(null)
      setError(null)
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to submit quotation') : (err as Error).message)
    },
  })

  function updateItem(index: number, field: keyof QuotationItemInput, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === 'description' ? value : Number(value) } : item)),
    )
  }

  async function handleDownload(id: number, quotationNumber: string) {
    setDownloadError(null)
    try {
      await quotationsApi.downloadPdf(id, quotationNumber)
    } catch {
      setDownloadError('Failed to download PDF.')
    }
  }

  const columns: DataTableColumn<Quotation>[] = [
    { key: 'quotationNumber', header: 'Quotation #', render: (q) => <span className="font-medium">{q.quotationNumber}</span> },
    { key: 'customer', header: 'Customer', render: (q) => q.customerName },
    { key: 'project', header: 'Project', render: (q) => q.projectName },
    { key: 'date', header: 'Date', render: (q) => new Date(q.quoteDate).toLocaleDateString() },
    { key: 'total', header: 'Total', render: (q) => `$${Number(q.total).toFixed(2)}` },
    {
      key: 'status',
      header: 'Status',
      render: (q) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${q.status === 'Approved' ? 'bg-green-600' : 'bg-amber-500'}`}>
          {q.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (q) =>
        q.status === 'Approved' ? (
          <Button size="sm" variant="outline" onClick={() => handleDownload(q.id, q.quotationNumber)}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        ) : (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Clock className="h-3.5 w-3.5" /> Awaiting Super Admin approval
          </span>
        ),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Make Quotation" />

      <Card className="mb-8">
        <CardContent className="space-y-3">
        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">{success}</div>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Order #</label>
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Customer ID</label>
            <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Customer Name <span className="text-destructive">*</span>
            </label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Minister Mahendere" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Project / Event Name</label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. July Worship Festival" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Items</label>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-2">Description</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Unit Price</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1">
                      <Input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td className="p-1 text-right font-medium">{(item.quantity * item.unitPrice).toFixed(2)}</td>
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
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="p-2 text-right text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="p-2 text-right">{subtotal.toFixed(2)}</td>
                  <td></td>
                </tr>
                {applyVat && (
                  <tr>
                    <td colSpan={3} className="p-2 text-right text-muted-foreground">
                      VAT (15.5%)
                    </td>
                    <td className="p-2 text-right">{vatAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                )}
                <tr className="border-t bg-secondary font-semibold">
                  <td colSpan={3} className="p-2 text-right">
                    TOTAL
                  </td>
                  <td className="p-2 text-right">{total.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" size="sm" variant="outline" onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}>
              + Add Item
            </Button>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={applyVat} onChange={(e) => setApplyVat(e.target.checked)} />
              Apply VAT (15.5%)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-1 lg:col-span-2">
            <label className="text-sm font-medium">Terms &amp; Conditions</label>
            <textarea
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              rows={7}
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Design Attachment</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="border-input w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
              onChange={(e) => setDesignFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-muted-foreground text-xs">Attach the design/artwork for this quotation (image or PDF).</p>
          </div>
        </div>

        <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Send className="mr-1.5 h-4 w-4" />
          {mutation.isPending ? 'Submitting…' : 'Submit for Approval'}
        </Button>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">My Submitted Quotations</h2>
      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}
      <DataTable
        columns={columns}
        data={myQuotations}
        keyExtractor={(q) => q.id}
        emptyMessage="No quotations submitted yet."
        rowClassName={(q) => (highlightedIds.has(q.id) ? 'bg-green-50 animate-pulse' : '')}
      />

      <ToastStack items={toasts} onDismiss={(id) => setToasts((t) => t.filter((item) => item.id !== id))} />
    </div>
  )
}
