import { api } from './client'

export type BoqItemStatus = 'Pending' | 'Fulfilled'

export interface BoqItem {
  id: number
  productId: number | null
  productName: string
  description: string | null
  unit: string | null
  quantity: string
  status: BoqItemStatus
}

export interface Boq {
  id: number
  boqNumber: string
  orderId: number
  orderNumber: string
  eventName: string
  clientName: string | null
  location: string
  createdAt: string
  items: BoqItem[]
}

interface BoqResponse {
  success: true
  data: { boq: Boq; shortfallCount: number }
}

interface BoqListResponse {
  success: true
  data: { boqs: Boq[] }
}

export function list() {
  return api.get<BoqListResponse>('/boqs').then((r) => r.data.data.boqs)
}

export interface BoqItemInput {
  productId: number
  description?: string
  unit?: string
  quantity: number
}

export interface BoqFormInput {
  orderId: number
  eventName: string
  clientName?: string
  location: string
  items: BoqItemInput[]
}

export function create(input: BoqFormInput) {
  return api.post<BoqResponse>('/boqs', input).then((r) => r.data.data)
}

// A plain <a href> wouldn't send the Bearer token (unlike the legacy's cookie-based PHP session,
// which any direct link navigation carries automatically) — fetch as a blob instead and trigger
// the download via an object URL.
export async function downloadPdf(id: number, boqNumber: string) {
  const response = await api.get(`/boqs/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `BOQ_${boqNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
