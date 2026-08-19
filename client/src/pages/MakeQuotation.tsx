import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Send, FileDown, Eye, Clock, Mail, Pencil, Search, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { ToastStack, type ToastItem } from '@/components/ui/toast'
import { QuotationEditModal } from '@/components/QuotationEditModal'
import { useAuth } from '@/hooks/useAuth'
import * as quotationsApi from '@/api/quotations'
import type { Quotation, QuotationItemInput } from '@/api/quotations'

// Polling interval for the real-time "your quotation was approved" alert — matches the app's
// other near-real-time polls (Task Calendar, Tracking).
const POLL_INTERVAL_MS = 15000

const DEFAULT_TERMS = [
  '1. Invoice valid for 14 working days.',
  '2. Payment required before commencement.',
  '3. Cancellations must be submitted in writing via email, and are subject to a cancellation charge of the non-refundable deposit if made more than 30 days before the event, 50% of the total contract value if made 15-30 days before, 75% if made 8-14 days before, or 100% if made 7 days or fewer before the event.',
  '4. Artwork must be confirmed no later than 14 days before the event.',
  '5. Artwork must be sent in high resolution PDF/EPS.',
  '6. Payable in USD.',
].join('\n')

const emptyItem: QuotationItemInput = { description: '', quantity: 1, unitPrice: 0 }

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  )
}

// Translated from makeQuotation.php + createQuotation.php (scoped from feature/work-log-sheet, see
// MIGRATION_PLAN.md §10). Legacy gated this to requireRole('Marketer'), a role already dropped in
// Module 2's normalization — submission is open to any authenticated role here instead.
export default function MakeQuotation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list, refetchInterval: POLL_INTERVAL_MS })

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [highlightTones, setHighlightTones] = useState<Map<number, 'success' | 'error'>>(new Map())
  const nextToastId = useRef(0)
  const prevStatusRef = useRef<Map<number, string> | null>(null)

  const myQuotations = (quotations ?? []).filter((q) => q.submittedBy.id === user?.id)

  // Real-time "your quotation was approved/rejected" alert: on every poll, compare each of my
  // quotations' status against what it was last poll. First run just records the baseline (a page
  // load shouldn't announce quotations already resolved before you opened the page) — afterwards,
  // a Pending -> Approved/Rejected transition triggers a toast + a temporary row highlight.
  useEffect(() => {
    const currentStatus = new Map(myQuotations.map((q) => [q.id, q.status]))
    if (prevStatusRef.current) {
      const prev = prevStatusRef.current
      for (const q of myQuotations) {
        if (prev.get(q.id) !== 'Pending') continue
        if (q.status === 'Approved') {
          setToasts((t) => [...t, { id: nextToastId.current++, message: `Your quotation ${q.quotationNumber} was approved!`, tone: 'success' }])
        } else if (q.status === 'Rejected') {
          setToasts((t) => [
            ...t,
            { id: nextToastId.current++, message: `Your quotation ${q.quotationNumber} was rejected: ${q.rejectionReason}`, tone: 'error' },
          ])
        } else {
          continue
        }
        setHighlightTones((h) => new Map(h).set(q.id, q.status === 'Approved' ? 'success' : 'error'))
        setTimeout(() => setHighlightTones((h) => { const next = new Map(h); next.delete(q.id); return next }), 8000)
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
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [tab, setTab] = useState<'new' | 'submitted'>('new')
  const [search, setSearch] = useState('')

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

  async function handleView(id: number) {
    setDownloadError(null)
    try {
      await quotationsApi.viewHtml(id)
    } catch {
      setDownloadError('Failed to open quotation.')
    }
  }

  async function handleShareWhatsApp(id: number, quotationNumber: string) {
    setDownloadError(null)
    try {
      const result = await quotationsApi.sharePdfToWhatsApp(id, quotationNumber)
      if (result === 'unsupported') {
        setDownloadError('This browser can’t attach files to WhatsApp directly — download the PDF instead and attach it manually.')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setDownloadError('Failed to share PDF.')
    }
  }

  async function handleShareEmail(id: number, quotationNumber: string) {
    setDownloadError(null)
    try {
      const result = await quotationsApi.sharePdfByEmail(id, quotationNumber)
      if (result === 'unsupported') {
        setDownloadError('This browser can’t attach files to an email directly — download the PDF instead and attach it manually.')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setDownloadError('Failed to share PDF.')
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
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium text-white ${
            q.status === 'Approved' ? 'bg-green-600' : q.status === 'Rejected' ? 'bg-destructive' : 'bg-amber-500'
          }`}
        >
          {q.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (q) => {
        if (q.status === 'Approved') {
          return (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => handleView(q.id)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" /> View
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDownload(q.id, q.quotationNumber)}>
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
              <Button
                size="icon"
                title="Send PDF via WhatsApp"
                onClick={() => handleShareWhatsApp(q.id, q.quotationNumber)}
                className="h-8 w-8 bg-[#25D366] text-white hover:opacity-90"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                title="Send PDF via Email"
                onClick={() => handleShareEmail(q.id, q.quotationNumber)}
                className="h-8 w-8"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          )
        }
        if (q.status === 'Rejected') {
          return (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(q)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <span className="text-destructive inline-flex items-center gap-1 text-xs" title={q.rejectionReason ?? undefined}>
                <XCircle className="h-3.5 w-3.5 shrink-0" /> {q.rejectionReason}
              </span>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(q)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Clock className="h-3.5 w-3.5" /> Awaiting approval
            </span>
          </div>
        )
      },
    },
  ]

  const searchTerm = search.trim().toLowerCase()
  const visibleQuotations = searchTerm
    ? myQuotations.filter((q) =>
        [q.quotationNumber, q.customerName, q.projectName, q.orderNumber].some((field) => field?.toLowerCase().includes(searchTerm)),
      )
    : myQuotations

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <PageHeader title="Make Quotation" />

      <div className="mb-5 flex w-fit gap-0.5 rounded-full bg-secondary p-1">
        {(['new', 'submitted'] as const).map((t) => (
          <button
            key={t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'new' ? 'New Quotation' : 'My Submitted Quotations'}
          </button>
        ))}
      </div>

      {tab === 'new' && (
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
      )}

      {tab === 'submitted' && (
      <>
      <div className="relative mb-3 max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by quotation #, customer, project, order #…"
          className="pl-9"
        />
      </div>
      {downloadError && <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{downloadError}</div>}
      <DataTable
        columns={columns}
        data={visibleQuotations}
        keyExtractor={(q) => q.id}
        emptyMessage={searchTerm ? 'No quotations match your search.' : 'No quotations submitted yet.'}
        rowClassName={(q) => {
          const tone = highlightTones.get(q.id)
          return tone === 'success' ? 'bg-green-50 animate-pulse' : tone === 'error' ? 'bg-red-50 animate-pulse' : ''
        }}
      />
      </>
      )}

      <ToastStack items={toasts} onDismiss={(id) => setToasts((t) => t.filter((item) => item.id !== id))} />

      {editing && <QuotationEditModal quotation={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
