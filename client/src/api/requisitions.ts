import { api } from './client'
import type { AuthUser } from '@/types/auth'

// "Product" isn't offered on the manual submission form (see Requisitions.tsx's TYPES) — it's
// only ever set by BOQ's auto-filed stock-shortfall requisitions (see MIGRATION_PLAN.md §29).
export type RequisitionType = 'Food' | 'Transport' | 'Tool' | 'Product' | 'Other'
export type RequisitionStatus = 'Pending' | 'Processed' | 'Approved' | 'Rejected'

export interface Requisition {
  id: number
  reqNumber: string
  projectManager: string
  eventName: string
  location: string
  eventDate: string
  teamMembers: string | null
  reqType: RequisitionType
  reqTypeOther: string | null
  displayType: string
  product: { id: number; name: string } | null
  quantity: string | null
  status: RequisitionStatus
  submittedBy: AuthUser
  processedBy: AuthUser | null
  processedAt: string | null
  createdAt: string
}

interface RequisitionListResponse {
  success: true
  data: { requisitions: Requisition[] }
}

interface RequisitionResponse {
  success: true
  data: { requisition: Requisition }
}

export function list() {
  return api.get<RequisitionListResponse>('/requisitions').then((r) => r.data.data.requisitions)
}

export interface RequisitionInput {
  projectManager: string
  eventName: string
  location: string
  eventDate: string
  teamMembers?: string
  reqType: RequisitionType
  reqTypeOther?: string
}

export function create(input: RequisitionInput) {
  return api.post<RequisitionResponse>('/requisitions', input).then((r) => r.data.data.requisition)
}

export function process(id: number) {
  return api.put<RequisitionResponse>(`/requisitions/${id}/process`).then((r) => r.data.data.requisition)
}
