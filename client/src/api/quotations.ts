import { api } from './client'

export type QuotationStatus = 'Pending' | 'Approved'

export interface Quotation {
  id: number
  quotationNumber: string
  customerName: string
  customerId: string | null
  projectName: string | null
  orderNumber: string | null
  quoteDate: string
  termsConditions: string
  designFile: string | null
  subtotal: string
  total: string
  status: QuotationStatus
  submittedById: number
  approvedById: number | null
  approvedAt: string | null
  createdAt: string
}

interface QuotationListResponse {
  success: true
  data: { quotations: Quotation[] }
}

// Stubbed now (AppShell's notifications bell needs the shape); full create/approve/PDF client
// lands with the dedicated Quotations feature task.
export function list() {
  return api.get<QuotationListResponse>('/quotations').then((r) => r.data.data.quotations)
}
