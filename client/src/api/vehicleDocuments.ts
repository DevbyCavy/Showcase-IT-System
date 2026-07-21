import { api } from './client'
import type { Vehicle } from './vehicles'

export type VehicleDocumentType = 'VehicleLicense' | 'Insurance' | 'FitnessCertificate' | 'RadioLicense' | 'Other'
export type VehicleDocumentStatus = 'Valid' | 'ExpiringSoon' | 'Expired'

export interface VehicleDocument {
  id: number
  vehicleId: number
  documentType: VehicleDocumentType
  documentNumber: string
  issueDate: string
  expiryDate: string
  reminderDays: number
  status: VehicleDocumentStatus
  uploadedFile: string | null
  notes: string | null
  vehicle: Vehicle
}

export interface VehicleDocumentStats {
  totalDocs: number
  expiredDocs: number
  expiringDocs: number
}

export function list() {
  return api.get<{ success: true; data: { documents: VehicleDocument[] } }>('/vehicle-documents').then((r) => r.data.data.documents)
}

export function stats() {
  return api.get<{ success: true; data: VehicleDocumentStats }>('/vehicle-documents/stats').then((r) => r.data.data)
}

export interface VehicleDocumentInput {
  vehicleId: number
  documentType: VehicleDocumentType
  documentNumber: string
  issueDate: string
  expiryDate: string
  reminderDays: number
  notes?: string
  file?: File
}

function toFormData(input: VehicleDocumentInput) {
  const formData = new FormData()
  formData.append('vehicleId', String(input.vehicleId))
  formData.append('documentType', input.documentType)
  formData.append('documentNumber', input.documentNumber)
  formData.append('issueDate', input.issueDate)
  formData.append('expiryDate', input.expiryDate)
  formData.append('reminderDays', String(input.reminderDays))
  if (input.notes) formData.append('notes', input.notes)
  if (input.file) formData.append('documentFile', input.file)
  return formData
}

export function create(input: VehicleDocumentInput) {
  return api.post('/vehicle-documents', toFormData(input))
}

export function update(id: number, input: VehicleDocumentInput) {
  return api.put(`/vehicle-documents/${id}`, toFormData(input))
}
