import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ArrowLeft, Eye, FileDown, Plus, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ToastStack, type ToastItem } from '@/components/ui/toast'
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge'
import * as financeApi from '@/api/finance'
import { PAYMENT_METHOD_LABELS, formatMoney, type AuditEntry, type Payment, type PaymentMethod, type ProformaInvoiceDetail } from '@/api/finance'

const AUDIT_LABELS: Record<string, string> = {
  'quotation.client_approved': 'Client approval confirmed',
  'proforma_invoice.created': 'Proforma invoice created',
  'proforma_invoice.document_generated': 'Invoice document generated',
  'payment.recorded': 'Payment recorded',
  'receipt.generated': 'Receipt generated',
}

// Integer cents, for client-side (supplementary) amount checks without float equality — the
// server re-validates everything with Decimal arithmetic.
function toCents(value: string) {
  const [whole, frac = ''] = value.split('.')
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const errorText = (err: unknown, fallback: string) =>
  isAxiosError(err) ? (err.response?.data?.error ?? fallback) : err instanceof Error ? err.message : fallback

// Finance (Accountant) + Super Admin — see MIGRATION_PLAN.md §34.
export default function ProformaInvoiceDetailPage() {
  const id = Number(useParams().id)
  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['proforma-invoices', 'detail', id],
    queryFn: () => financeApi.getInvoice(id),
    enabled: Number.isInteger(id) && id > 0,
  })
  const [recording, setRecording] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextToastId = useRef(0)
  const [lastPayment, setLastPayment] = useState<Payment | null>(null)

  async function runDoc(action: () => Promise<void>) {
    setDocError(null)
    try {
      await action()
    } catch {
      setDocError('Failed to generate the document. Nothing was lost — retry, or use View for the printable version.')
    }
  }

  if (isLoading) return <div className="text-muted-foreground p-8 text-sm">Loading invoice…</div>
  if (isError || !invoice) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorText(error, 'Invoice not found.')}</div>
        <Link to="/finance/proforma-invoices" className="mt-4 inline-flex items-center gap-1 text-sm hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
      </div>
    )
  }

  const cur = invoice.currency
  const fullyPaid = invoice.paymentStatus === 'FullyPaid'

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <Link to="/finance/proforma-invoices" className="text-muted-foreground mb-3 inline-flex items-center gap-1 text-sm hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All proforma invoices
      </Link>
      <PageHeader
        title={`Proforma Invoice ${invoice.invoiceNumber}`}
        subtitle={
          <>
            From quotation <span className="font-medium">{invoice.quotation.quotationNumber}</span> · issued{' '}
            {new Date(invoice.issuedAt).toLocaleDateString()}
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => runDoc(() => financeApi.viewInvoice(invoice.id))}>
              <Eye className="mr-1.5 h-4 w-4" /> View
            </Button>
            <Button variant="outline" onClick={() => runDoc(() => financeApi.downloadInvoicePdf(invoice.id, invoice.invoiceNumber))}>
              <FileDown className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => setRecording(true)} disabled={fullyPaid} title={fullyPaid ? 'This invoice is fully paid.' : undefined}>
              <Plus className="mr-1.5 h-4 w-4" /> Record Payment
            </Button>
          </div>
        }
      />

      {docError && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{docError}</div>}

      {lastPayment && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>
            Payment of <strong>{formatMoney(lastPayment.amount, cur)}</strong> recorded — receipt <strong>{lastPayment.receiptNumber}</strong> covers this
            payment only.
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => runDoc(() => financeApi.viewReceipt(lastPayment.id))}>
              <Eye className="mr-1.5 h-3.5 w-3.5" /> View receipt
            </Button>
            <Button size="sm" variant="outline" onClick={() => runDoc(() => financeApi.downloadReceiptPdf(lastPayment.id, lastPayment.receiptNumber))}>
              <FileDown className="mr-1.5 h-3.5 w-3.5" /> Receipt PDF
            </Button>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="Invoice total" value={formatMoney(invoice.total, cur)} />
        <SummaryTile label="Amount paid" value={formatMoney(invoice.amountPaid, cur)} />
        <SummaryTile label="Balance due" value={formatMoney(invoice.balanceDue, cur)} emphasis />
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-muted-foreground mb-1.5 text-xs font-medium uppercase">Payment status</div>
          <PaymentStatusBadge status={invoice.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs uppercase">
                    <th className="py-2 pr-2">Description</th>
                    <th className="py-2 pr-2 text-right">Qty</th>
                    <th className="py-2 pr-2 text-right">Unit price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">{i.description}</td>
                      <td className="py-2 pr-2 text-right">{Number(i.quantity)}</td>
                      <td className="py-2 pr-2 text-right">{formatMoney(i.unitPrice, cur)}</td>
                      <td className="py-2 text-right">{formatMoney(i.lineTotal, cur)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-medium">
                  <tr>
                    <td colSpan={3} className="pt-3 pr-2 text-right">Subtotal</td>
                    <td className="pt-3 text-right">{formatMoney(invoice.subtotal, cur)}</td>
                  </tr>
                  {invoice.applyVat && (
                    <tr>
                      <td colSpan={3} className="pr-2 text-right">VAT (15.5%)</td>
                      <td className="text-right">{formatMoney(invoice.vatAmount, cur)}</td>
                    </tr>
                  )}
                  <tr className="font-bold">
                    <td colSpan={3} className="pr-2 text-right">Total</td>
                    <td className="text-right">{formatMoney(invoice.total, cur)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 text-sm">
            <CardTitle>Client</CardTitle>
            <div>
              <div className="font-medium">{invoice.customerName}</div>
              {invoice.customerId && <div className="text-muted-foreground">Customer ID {invoice.customerId}</div>}
              {invoice.projectName && <div>{invoice.projectName}</div>}
              {invoice.orderNumber && <div className="text-muted-foreground">Order {invoice.orderNumber}</div>}
            </div>
            <div className="border-t pt-3">
              <div className="text-muted-foreground text-xs uppercase">Client approval</div>
              <div>
                {invoice.quotation.clientApprovedAt ? new Date(invoice.quotation.clientApprovedAt).toLocaleString() : '—'}
                {invoice.quotation.clientApprovedBy && (
                  <span className="text-muted-foreground">
                    {' '}
                    by {invoice.quotation.clientApprovedBy.name} {invoice.quotation.clientApprovedBy.surname}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent>
          <CardHeader>
            <CardTitle>Payments &amp; receipts</CardTitle>
          </CardHeader>
          {invoice.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs uppercase">
                    <th className="py-2 pr-2">Receipt #</th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Method</th>
                    <th className="py-2 pr-2">Reference</th>
                    <th className="py-2 pr-2 text-right">Amount</th>
                    <th className="py-2 pr-2 text-right">Balance after</th>
                    <th className="py-2 pr-2">Recorded by</th>
                    <th className="py-2">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-b align-top last:border-0">
                      <td className="py-2 pr-2 font-medium">{p.receiptNumber}</td>
                      <td className="py-2 pr-2">{new Date(p.paymentDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}</td>
                      <td className="py-2 pr-2">{PAYMENT_METHOD_LABELS[p.method]}</td>
                      <td className="py-2 pr-2">
                        {p.reference ?? '—'}
                        {p.notes && <div className="text-muted-foreground text-xs">{p.notes}</div>}
                      </td>
                      <td className="py-2 pr-2 text-right">{formatMoney(p.amount, cur)}</td>
                      <td className="py-2 pr-2 text-right">{formatMoney(p.balanceAfter, cur)}</td>
                      <td className="py-2 pr-2">
                        {p.recordedBy.name} {p.recordedBy.surname}
                        <div className="text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => runDoc(() => financeApi.viewReceipt(p.id))} aria-label={`View receipt ${p.receiptNumber}`}>
                            <Receipt className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runDoc(() => financeApi.downloadReceiptPdf(p.id, p.receiptNumber))}
                            aria-label={`Download receipt ${p.receiptNumber} PDF`}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent>
          <CardHeader>
            <CardTitle>Audit history</CardTitle>
          </CardHeader>
          <AuditTrail entries={invoice.auditTrail} />
        </CardContent>
      </Card>

      {recording && (
        <RecordPaymentModal
          invoice={invoice}
          onClose={() => setRecording(false)}
          onRecorded={(payment, duplicate) => {
            setRecording(false)
            setLastPayment(payment)
            setToasts((t) => [
              ...t,
              {
                id: nextToastId.current++,
                tone: duplicate ? 'info' : 'success',
                message: duplicate
                  ? `This payment was already recorded as ${payment.receiptNumber} — no duplicate created.`
                  : `Payment recorded — receipt ${payment.receiptNumber}.`,
              },
            ])
          }}
        />
      )}

      <ToastStack items={toasts} onDismiss={(toastId) => setToasts((t) => t.filter((item) => item.id !== toastId))} />
    </div>
  )
}

function SummaryTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">{label}</div>
      <div className={`text-lg font-bold ${emphasis ? 'text-brand-orange' : ''}`}>{value}</div>
    </div>
  )
}

function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <p className="text-muted-foreground text-sm">No audit entries.</p>
  return (
    <ol className="space-y-2 text-sm">
      {entries.map((a) => {
        const ref = (a.metadata?.receiptNumber ?? a.metadata?.invoiceNumber) as string | undefined
        const amount = a.metadata?.amount as string | undefined
        return (
          <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
            <span>
              <span className="font-medium">{AUDIT_LABELS[a.action] ?? a.action}</span>
              {ref && <span className="text-muted-foreground"> · {ref}</span>}
              {amount && <span className="text-muted-foreground"> · {formatMoney(amount)}</span>}
            </span>
            <span className="text-muted-foreground text-xs">
              {a.actor.name} {a.actor.surname} · {new Date(a.createdAt).toLocaleString()}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function RecordPaymentModal({
  invoice,
  onClose,
  onRecorded,
}: {
  invoice: ProformaInvoiceDetail
  onClose: () => void
  onRecorded: (payment: Payment, duplicate: boolean) => void
}) {
  const queryClient = useQueryClient()
  const amountRef = useRef<HTMLInputElement>(null)
  // One key per opened form: a network retry of the same submission reuses it, so the server
  // returns the original payment instead of recording it twice.
  const [idempotencyKey] = useState(newIdempotencyKey)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(localToday)
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const cur = invoice.currency
  const balanceCents = toCents(Number(invoice.balanceDue).toFixed(2))

  const mutation = useMutation({
    mutationFn: () =>
      financeApi.recordPayment(invoice.id, {
        amount: amount.trim(),
        paymentDate,
        method: method as PaymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotencyKey,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proforma-invoices'] })
      onRecorded(data.payment, data.duplicate)
    },
  })

  useEffect(() => {
    amountRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mutation.isPending, onClose])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (mutation.isPending) return
    const trimmed = amount.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return setClientError('Enter a valid amount, e.g. 1500 or 1500.50.')
    const cents = toCents(trimmed)
    if (cents <= 0) return setClientError('Amount must be greater than zero.')
    if (cents > balanceCents) return setClientError(`Amount can't exceed the outstanding balance of ${formatMoney(invoice.balanceDue, cur)}.`)
    if (!paymentDate) return setClientError('Payment date is required.')
    if (!method) return setClientError('Choose a payment method.')
    setClientError(null)
    mutation.mutate()
  }

  const settles = /^\d+(\.\d{1,2})?$/.test(amount.trim()) && toCents(amount.trim()) === balanceCents
  const shownError = clientError ?? (mutation.error ? errorText(mutation.error, 'Failed to record payment.') : null)
  const labelClass = 'mb-1 block text-sm font-medium'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !mutation.isPending && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <h3 id="record-payment-title" className="mb-1 text-lg font-semibold">
          Record Payment
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {invoice.invoiceNumber} · {invoice.customerName}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3 text-center text-xs">
          <div>
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{formatMoney(invoice.total, cur)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Paid</div>
            <div className="font-semibold">{formatMoney(invoice.amountPaid, cur)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Balance</div>
            <div className="text-brand-orange font-semibold">{formatMoney(invoice.balanceDue, cur)}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="pay-amount" className={labelClass}>
              Amount received ({cur})
            </label>
            <Input
              id="pay-amount"
              ref={amountRef}
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-describedby="pay-amount-help"
            />
            <p id="pay-amount-help" className="text-muted-foreground mt-1 text-xs">
              Enter the actual amount received.{' '}
              {settles ? 'This settles the invoice in full.' : 'A partial amount is recorded as a deposit; its receipt covers this payment only.'}{' '}
              <button type="button" className="text-brand-orange font-medium hover:underline" onClick={() => setAmount(Number(invoice.balanceDue).toFixed(2))}>
                Use full balance
              </button>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pay-date" className={labelClass}>
                Payment date
              </label>
              <Input id="pay-date" type="date" max={localToday()} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pay-method" className={labelClass}>
                Method
              </label>
              <select
                id="pay-method"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod | '')}
              >
                <option value="">Select…</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="pay-ref" className={labelClass}>
              Payment reference <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input id="pay-ref" placeholder="Bank / transaction reference" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={500} />
          </div>
          <div>
            <label htmlFor="pay-notes" className={labelClass}>
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="pay-notes"
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>

        {shownError && (
          <div role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {shownError}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
