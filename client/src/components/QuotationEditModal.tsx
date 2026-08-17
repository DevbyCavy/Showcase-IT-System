import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as quotationsApi from '@/api/quotations'
import type { Quotation, QuotationItemInput } from '@/api/quotations'

interface QuotationEditModalProps {
  quotation: Quotation
  onClose: () => void
}

const VAT_RATE = 0.155

// Shared by MakeQuotation.tsx (Marketer editing their own Pending quotation) and
// ProcessQuotations.tsx (Super Admin editing any quotation) — see
// quotation.service.ts#update for the matching server-side ownership/status rules.
export function QuotationEditModal({ quotation, onClose }: QuotationEditModalProps) {
  const queryClient = useQueryClient()

  const [customerName, setCustomerName] = useState(quotation.customerName)
  const [customerId, setCustomerId] = useState(quotation.customerId ?? '')
  const [projectName, setProjectName] = useState(quotation.projectName ?? '')
  const [orderNumber, setOrderNumber] = useState(quotation.orderNumber ?? '')
  const [quoteDate, setQuoteDate] = useState(quotation.quoteDate.slice(0, 10))
  const [termsConditions, setTermsConditions] = useState(quotation.termsConditions)
  const [items, setItems] = useState<QuotationItemInput[]>(
    quotation.items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
  )
  const [applyVat, setApplyVat] = useState(quotation.applyVat)
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const vatAmount = applyVat ? subtotal * VAT_RATE : 0
  const total = subtotal + vatAmount

  const mutation = useMutation({
    mutationFn: () =>
      quotationsApi.update(
        quotation.id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      onClose()
    },
    onError: (err) => {
      setError(isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to update quotation') : (err as Error).message)
    },
  })

  function updateItem(index: number, field: keyof QuotationItemInput, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === 'description' ? value : Number(value) } : item)),
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">Edit Quotation {quotation.quotationNumber}</h3>

        {error && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
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
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Project / Event Name</label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])}
              >
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
                rows={6}
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
              <p className="text-muted-foreground text-xs">
                {quotation.designFile ? 'Leave blank to keep the current attachment.' : 'Attach the design/artwork for this quotation.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
