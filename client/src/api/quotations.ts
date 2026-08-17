import { api } from './client'
import type { AuthUser } from '@/types/auth'

export type QuotationStatus = 'Pending' | 'Approved' | 'Rejected'

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
  applyVat: boolean
  vatAmount: string
  total: string
  status: QuotationStatus
  submittedBy: AuthUser
  approvedBy: AuthUser | null
  approvedAt: string | null
  rejectedBy: AuthUser | null
  rejectedAt: string | null
  rejectionReason: string | null
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
  applyVat?: boolean
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
  form.append('applyVat', input.applyVat ? 'true' : 'false')
  form.append('items', JSON.stringify(input.items))
  if (designFile) form.append('designFile', designFile)
  return form
}

export function create(input: QuotationInput, designFile?: File) {
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

export function reject(id: number, reason: string) {
  return api.put<QuotationResponse>(`/quotations/${id}/reject`, { reason }).then((r) => r.data.data.quotation)
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

async function fetchPdfFile(id: number, quotationNumber: string): Promise<File> {
  const response = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' })
  return new File([response.data as Blob], `Quotation_${quotationNumber}.pdf`, { type: 'application/pdf' })
}

// Neither WhatsApp (wa.me) nor mailto: links can attach a file via URL — both only pre-fill
// text. The only way to hand over the actual PDF is the OS share sheet via the Web Share API's
// `files` support, which lets the user pick a WhatsApp contact or mail client and attaches the
// file directly. Returns 'unsupported' when the browser/device can't share files so the caller
// can fall back to a plain download instead.
async function shareFile(file: File, title: string): Promise<'shared' | 'unsupported'> {
  if (!navigator.canShare?.({ files: [file] })) return 'unsupported'
  await navigator.share({ files: [file], title })
  return 'shared'
}

export async function sharePdfToWhatsApp(id: number, quotationNumber: string) {
  return shareFile(await fetchPdfFile(id, quotationNumber), `Quotation ${quotationNumber}`)
}

export async function sharePdfByEmail(id: number, quotationNumber: string) {
  return shareFile(await fetchPdfFile(id, quotationNumber), `Quotation ${quotationNumber}`)
}
