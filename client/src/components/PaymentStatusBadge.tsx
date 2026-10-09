import { PAYMENT_STATUS_LABELS, type InvoicePaymentStatus } from '@/api/finance'

// Same solid status-pill look as the quotation Pending/Approved/Rejected badges.
const TONES: Record<InvoicePaymentStatus, string> = {
  Unpaid: 'bg-destructive',
  Deposited: 'bg-amber-500',
  FullyPaid: 'bg-green-600',
}

export function PaymentStatusBadge({ status }: { status: InvoicePaymentStatus }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white ${TONES[status]}`}>{PAYMENT_STATUS_LABELS[status]}</span>
}
