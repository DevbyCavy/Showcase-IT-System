import { api } from './client'
import type { AuthUser } from '@/types/auth'

// Proforma invoices & payments (Finance = Accountant + Super Admin) — see MIGRATION_PLAN.md §34.
// Money fields arrive as 2-decimal strings (Prisma Decimal's JSON form), same as quotations.

export type InvoicePaymentStatus = 'Unpaid' | 'Deposited' | 'FullyPaid'
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'MobileMoney' | 'Card' | 'Cheque' | 'Other'

export const PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  Unpaid: 'Unpaid',
  Deposited: 'Deposited',
  FullyPaid: 'Fully Paid',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Cash',
  BankTransfer: 'Bank Transfer',
  MobileMoney: 'Mobile Money',
  Card: 'Card',
  Cheque: 'Cheque',
  Other: 'Other',
}

export interface Payment {
  id: number
  receiptNumber: string
  invoiceId: number
  amount: string
  paymentDate: string
  method: PaymentMethod
  reference: string | null
  notes: string | null
  balanceAfter: string
  recordedBy: AuthUser
  createdAt: string
}

export interface ProformaInvoice {
  id: number
  invoiceNumber: string
  quotation: { id: number; quotationNumber: string; clientApprovedAt: string | null; clientApprovedBy: AuthUser | null }
  customerName: string
  customerId: string | null
  projectName: string | null
  orderNumber: string | null
  termsConditions: string
  currency: string
  subtotal: string
  applyVat: boolean
  vatAmount: string
  total: string
  amountPaid: string
  balanceDue: string
  paymentStatus: InvoicePaymentStatus
  issuedAt: string
  createdBy: AuthUser
  items: { id: number; description: string; quantity: string; unitPrice: string; lineTotal: string }[]
  payments: Payment[]
}

export interface AuditEntry {
  id: number
  action: string
  entityType: string
  entityId: number
  metadata: Record<string, unknown> | null
  actor: AuthUser
  createdAt: string
}

export interface ProformaInvoiceDetail extends ProformaInvoice {
  auditTrail: AuditEntry[]
}

export interface InvoiceListResult {
  invoices: ProformaInvoice[]
  total: number
  counts: Record<InvoicePaymentStatus, number>
}

export function listInvoices(params: { status?: InvoicePaymentStatus; search?: string }) {
  return api
    .get<{ success: true; data: InvoiceListResult }>('/finance/proforma-invoices', { params })
    .then((r) => r.data.data)
}

export function getInvoice(id: number) {
  return api
    .get<{ success: true; data: { invoice: ProformaInvoiceDetail } }>(`/finance/proforma-invoices/${id}`)
    .then((r) => r.data.data.invoice)
}

export interface RecordPaymentInput {
  amount: string
  paymentDate: string
  method: PaymentMethod
  reference?: string
  notes?: string
  idempotencyKey: string
}

export function recordPayment(invoiceId: number, input: RecordPaymentInput) {
  return api
    .post<{ success: true; data: { duplicate: boolean; payment: Payment; invoice: ProformaInvoice } }>(
      `/finance/proforma-invoices/${invoiceId}/payments`,
      input,
    )
    .then((r) => r.data.data)
}

// Same blob-download / new-tab-preview approach as api/quotations.ts (a plain <a href> wouldn't
// carry the Bearer token).
async function downloadBlob(url: string, filename: string) {
  const response = await api.get(url, { responseType: 'blob' })
  const objectUrl = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

async function openHtml(url: string) {
  const win = window.open('', '_blank')
  const response = await api.get(url, { responseType: 'blob' })
  const objectUrl = URL.createObjectURL(response.data as Blob)
  if (win) {
    win.location.href = objectUrl
  } else {
    window.open(objectUrl, '_blank')
  }
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
}

export const downloadInvoicePdf = (id: number, invoiceNumber: string) =>
  downloadBlob(`/finance/proforma-invoices/${id}/pdf`, `Proforma_${invoiceNumber}.pdf`)
export const viewInvoice = (id: number) => openHtml(`/finance/proforma-invoices/${id}/view`)
export const downloadReceiptPdf = (paymentId: number, receiptNumber: string) =>
  downloadBlob(`/finance/payments/${paymentId}/receipt`, `Receipt_${receiptNumber}.pdf`)
export const viewReceipt = (paymentId: number) => openHtml(`/finance/payments/${paymentId}/receipt/view`)

export function formatMoney(value: string | number, currency = 'USD') {
  const formatted = Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency === 'USD' ? `$${formatted}` : `${currency} ${formatted}`
}
