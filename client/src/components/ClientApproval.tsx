import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { BadgeCheck, Handshake } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import * as quotationsApi from '@/api/quotations'
import type { Quotation } from '@/api/quotations'

// MIGRATION_PLAN.md §34. Shown on an internally Approved quotation: before client approval it's a
// "Client Approved" button behind a confirmation modal; afterwards it's a badge with the proforma
// invoice number (a link for Finance/Super Admin, who can open the invoice; plain text for a
// Marketer, who can't). The server enforces eligibility/ownership and duplicate prevention
// regardless of what this renders.
export function ClientApprovalAction({ quotation }: { quotation: Quotation }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (quotation.status !== 'Approved') return null

  let trigger
  if (quotation.proformaInvoice) {
    const canOpenInvoice = user?.role === 'SuperAdmin' || user?.role === 'Accountant'
    const label = `Client approved · ${quotation.proformaInvoice.invoiceNumber}`
    const title = quotation.clientApprovedAt
      ? `Confirmed ${new Date(quotation.clientApprovedAt).toLocaleString()}${
          quotation.clientApprovedBy ? ` by ${quotation.clientApprovedBy.name} ${quotation.clientApprovedBy.surname}` : ''
        }`
      : undefined
    const className = 'inline-flex items-center gap-1 whitespace-nowrap rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
    trigger = canOpenInvoice ? (
      <Link to={`/finance/proforma-invoices/${quotation.proformaInvoice.id}`} className={`${className} hover:underline`} title={title}>
        <BadgeCheck className="h-3.5 w-3.5" /> {label}
      </Link>
    ) : (
      <span className={className} title={title}>
        <BadgeCheck className="h-3.5 w-3.5" /> {label}
      </span>
    )
  } else {
    trigger = (
      <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => setOpen(true)}>
        <Handshake className="mr-1.5 h-3.5 w-3.5" /> Client Approved
      </Button>
    )
  }

  // The modal is rendered in both branches (same slot) so it survives the button -> badge switch
  // that the post-confirm quotations refetch causes — otherwise the success view (invoice number,
  // View Invoice link) would unmount the instant the list refreshes. Portaled out of the table
  // cell so the overlay isn't nested inside the DataTable's overflow containers.
  return (
    <>
      {trigger}
      {open && createPortal(<ClientApprovalModal quotation={quotation} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function ClientApprovalModal({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [result, setResult] = useState<{ created: boolean; invoice: { id: number; invoiceNumber: string } } | null>(null)

  const mutation = useMutation({
    mutationFn: () => quotationsApi.confirmClientApproval(quotation.id),
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['proforma-invoices'] })
    },
  })

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mutation.isPending, onClose])

  const errorMessage = mutation.error
    ? isAxiosError(mutation.error)
      ? (mutation.error.response?.data?.error ?? 'Failed to confirm client approval.')
      : (mutation.error as Error).message
    : null
  const canOpenInvoice = user?.role === 'SuperAdmin' || user?.role === 'Accountant'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !mutation.isPending && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-approval-title"
        className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {result ? (
          <>
            <h3 id="client-approval-title" className="mb-2 text-lg font-semibold">
              {result.created ? 'Proforma Invoice Created' : 'Invoice Already Exists'}
            </h3>
            <p className="mb-1 text-sm">
              {result.created
                ? 'Client approval recorded. The proforma invoice is now available to Finance:'
                : 'This quotation already has a proforma invoice — no duplicate was created:'}
            </p>
            <p className="mb-5 text-lg font-bold">{result.invoice.invoiceNumber}</p>
            <div className="flex justify-center gap-3">
              {canOpenInvoice && (
                <Link to={`/finance/proforma-invoices/${result.invoice.id}`} className={buttonVariants()}>
                  View Invoice
                </Link>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 id="client-approval-title" className="mb-2 text-lg font-semibold">
              Confirm Client Approval
            </h3>
            <p className="mb-3">Are you sure the client has approved this quotation?</p>
            <div className="mb-4 rounded-lg bg-secondary px-3 py-2 text-sm">
              <div className="font-bold">{quotation.quotationNumber}</div>
              <div className="text-muted-foreground">
                {quotation.customerName} · Total ${Number(quotation.total).toFixed(2)}
              </div>
            </div>
            <p className="text-muted-foreground mb-5 text-xs">This creates the proforma invoice for Finance. It can't be undone from here.</p>
            {errorMessage && <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</div>}
            <div className="flex justify-center gap-3">
              <Button ref={cancelRef} variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? 'Confirming…' : 'Yes, Confirm'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
