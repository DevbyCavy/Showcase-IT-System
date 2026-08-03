// Translated from requisitions.php/createRequisition.php (public-to-any-authenticated-user
// submission form) and processRequisitions.php/processRequisition.php (Super-Admin-only approval).

import { ApiError } from '../middleware/errorHandler'
import * as requisitionRepository from '../repositories/requisition.repository'
import type { RequisitionBody } from '../validations/requisition.validation'
import { toPublicUser } from '../utils/mapUser'

function toPublicRequisition(r: Awaited<ReturnType<typeof requisitionRepository.findAll>>[number]) {
  return {
    id: r.id,
    reqNumber: r.reqNumber,
    projectManager: r.projectManager,
    eventName: r.eventName,
    location: r.location,
    eventDate: r.eventDate,
    teamMembers: r.teamMembers,
    reqType: r.reqType,
    reqTypeOther: r.reqTypeOther,
    // Mirrors createRequisition.php's $finalType at display time, without storing free text in
    // the reqType enum column itself. Product-type requisitions (BOQ stock shortfalls — see
    // boq.repository.ts#create) get a descriptive label instead of the bare enum value.
    displayType:
      r.reqType === 'Other' && r.reqTypeOther
        ? r.reqTypeOther
        : r.reqType === 'Product' && r.product
          ? `Product — ${r.product.name}`
          : r.reqType,
    product: r.product ? { id: r.product.id, name: r.product.name } : null,
    quantity: r.quantity,
    status: r.status,
    submittedBy: toPublicUser(r.submittedBy),
    processedBy: r.processedBy ? toPublicUser(r.processedBy) : null,
    processedAt: r.processedAt,
    createdAt: r.createdAt,
  }
}

export async function list() {
  const requisitions = await requisitionRepository.findAll()
  return requisitions.map(toPublicRequisition)
}

export async function create(input: RequisitionBody, submittedById: number) {
  const requisition = await requisitionRepository.create({ ...input, submittedById })
  return toPublicRequisition(requisition)
}

export async function process(id: number, processedById: number) {
  const requisition = await requisitionRepository.findById(id)
  if (!requisition) {
    throw new ApiError(404, 'Requisition not found.')
  }
  const processed = await requisitionRepository.markProcessed(id, processedById)
  if (!processed) {
    throw new ApiError(400, 'Could not process — already processed or not found.')
  }
  return toPublicRequisition((await requisitionRepository.findById(id))!)
}
