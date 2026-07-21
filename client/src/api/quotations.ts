import { api } from './client'
import type { AuthUser } from '@/types/auth'

export type QuotationStatus = 'Pending' | 'Approved'

export interface QuotationItem {
  id: number
  description: string
  quantity: string
  unitPrice: string
  lineTotal: string
  sortOrder: number
}

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
  submittedBy: AuthUser
  approvedBy: AuthUser | null
  approvedAt: string | null
  createdAt: string
  items: QuotationItem[]
}

interface QuotationListResponse {
  success: true
  data: { quotations: Quotation[] }
}

interface QuotationResponse {
  success: true
  data: { quotation: Quotation }
}

export function list() {
  return api.get<QuotationListResponse>('/quotations').then((r) => r.data.data.quotations)
}

export function getOne(id: number) {
  return api.get<QuotationResponse>(`/quotations/${id}`).then((r) => r.data.data.quotation)
}

export interface QuotationItemInput {
  description: string
  quantity: number
  unitPrice: number
}

export interface QuotationInput {
  customerName: string
  customerId?: string
  projectName?: string
  orderNumber?: string
  quoteDate: string
  termsConditions?: string
  items: QuotationItemInput[]
}

function toFormData(input: QuotationInput, designFile?: File) {
  const form = new FormData()
  form.append('customerName', input.customerName)
  if (input.customerId) form.append('customerId', input.customerId)
  if (input.projectName) form.append('projectName', input.projectName)
  if (input.orderNumber) form.append('orderNumber', input.orderNumber)
  form.append('quoteDate', input.quoteDate)
  if (input.termsConditions) form.append('termsConditions', input.termsConditions)
  form.append('items', JSON.stringify(input.items))
  if (designFile) form.append('designFile', designFile)
  return form
}

export function create(input: QuotationInput, designFile: File) {
  return api
    .post<QuotationResponse>('/quotations', toFormData(input, designFile), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.data.quotation)
}

export function update(id: number, input: QuotationInput, designFile?: File) {
  return api
    .put<QuotationResponse>(`/quotations/${id}`, toFormData(input, designFile), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.data.quotation)
}

export function approve(id: number) {
  return api.put<QuotationResponse>(`/quotations/${id}/approve`).then((r) => r.data.data.quotation)
}

// A plain <a href> wouldn't send the Bearer token (unlike the legacy's cookie-based PHP session,
// which any direct link navigation carries automatically) — fetch as a blob instead and trigger
// the download via an object URL.
export async function downloadPdf(id: number, quotationNumber: string) {
  const response = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Quotation_${quotationNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
