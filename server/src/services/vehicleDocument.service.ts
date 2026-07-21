// Translated from includes/vehicles/vehicleDocuments.php. Two real bugs fixed here (see
// MIGRATION_PLAN.md): (1) the actual <form> only ever had a document_type field — every other
// column the INSERT expects was missing from the HTML, so the feature never worked at all, not
// just because of bug (2): the INSERT bound `$uploadeFile` (typo, undefined variable) instead of
// `$uploadedFile`, so even a hand-crafted request would have stored a NULL file path despite the
// upload succeeding on disk. Both fixed; the standalone dead badge block that referenced an
// undefined `$daysRemaining` at the top of the legacy file (outside any loop) is not reproduced.

import { ApiError } from '../middleware/errorHandler'
import * as vehicleDocumentRepository from '../repositories/vehicleDocument.repository'
import * as vehicleRepository from '../repositories/vehicle.repository'
import type { VehicleDocumentBody } from '../validations/vehicleDocument.validation'

export function list() {
  return vehicleDocumentRepository.findAll()
}

export function stats() {
  return vehicleDocumentRepository.stats()
}

// Mirrors the legacy's exact status computation: Expired if past due, Expiring Soon if within
// reminderDays of now, else Valid.
function computeStatus(expiryDate: Date, reminderDays: number): 'Valid' | 'ExpiringSoon' | 'Expired' {
  const now = Date.now()
  if (expiryDate.getTime() < now) {
    return 'Expired'
  }
  const reminderThreshold = now + reminderDays * 24 * 60 * 60 * 1000
  if (expiryDate.getTime() <= reminderThreshold) {
    return 'ExpiringSoon'
  }
  return 'Valid'
}

export async function create(input: VehicleDocumentBody, uploadedFile?: string) {
  const vehicle = await vehicleRepository.findById(input.vehicleId)
  if (!vehicle) {
    throw new ApiError(400, 'Selected vehicle could not be found')
  }
  const status = computeStatus(input.expiryDate, input.reminderDays)
  return vehicleDocumentRepository.create({ ...input, status, uploadedFile })
}

export async function update(id: number, input: VehicleDocumentBody, uploadedFile?: string) {
  const existing = await vehicleDocumentRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Document not found')
  }
  const status = computeStatus(input.expiryDate, input.reminderDays)
  return vehicleDocumentRepository.update(id, { ...input, status, uploadedFile })
}
