import { api } from './client'
import type { TakeoffDesignStatus, TakeoffPdfType } from './takeoffProjects'

export type TakeoffItemCategory = 'Structure' | 'Cladding' | 'Electrical' | 'Furniture' | 'Other'
export type TakeoffItemSource = 'Extracted' | 'Predicted' | 'Inferred'
export type TakeoffItemConfidence = 'High' | 'Medium' | 'Low'
export type TakeoffClarificationTopic = 'Material' | 'Measurement' | 'Other'
export type TakeoffClarificationStatus = 'Pending' | 'Answered'

export interface TakeoffClarification {
  id: number
  topic: TakeoffClarificationTopic
  question: string
  status: TakeoffClarificationStatus
  answer: string | null
}

export interface TakeoffItem {
  id: number
  description: string
  category: TakeoffItemCategory
  material: string | null
  widthMm: string | null
  heightMm: string | null
  lengthMm: string | null
  unit: string
  quantity: string
  source: TakeoffItemSource
  confidence: TakeoffItemConfidence
  notes: string | null
}

export interface TakeoffDesign {
  id: number
  projectId: number
  originalFilename: string
  pdfType: TakeoffPdfType | null
  status: TakeoffDesignStatus
  failureReason: string | null
  uploadedAt: string
  project: { id: number; name: string; clientName: string | null }
  items: TakeoffItem[]
  clarifications: TakeoffClarification[]
}

interface TakeoffDesignResponse {
  success: true
  data: { design: TakeoffDesign }
}

interface TakeoffItemResponse {
  success: true
  data: { item: TakeoffItem }
}

export function getOne(id: number) {
  return api.get<TakeoffDesignResponse>(`/takeoff-designs/${id}`).then((r) => r.data.data.design)
}

export interface TakeoffItemUpdateInput {
  description?: string
  category?: TakeoffItemCategory
  material?: string | null
  widthMm?: number | null
  heightMm?: number | null
  lengthMm?: number | null
  unit?: string
  quantity?: number
  notes?: string | null
}

export function updateItem(designId: number, itemId: number, input: TakeoffItemUpdateInput) {
  return api.patch<TakeoffItemResponse>(`/takeoff-designs/${designId}/items/${itemId}`, input).then((r) => r.data.data.item)
}

export function answerClarifications(designId: number, answers: { clarificationId: number; answer: string }[]) {
  return api.post(`/takeoff-designs/${designId}/answers`, { answers })
}

// Plain <a href> wouldn't carry the Bearer token — same blob-download pattern as boqApi.downloadPdf.
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

export function downloadXlsx(id: number) {
  return downloadBlob(`/takeoff-designs/${id}/export/xlsx`, `Takeoff_${id}.xlsx`)
}

export function downloadQuotationPdf(id: number) {
  return downloadBlob(`/takeoff-designs/${id}/export/quotation.pdf`, `Takeoff_BOQ_${id}.pdf`)
}
