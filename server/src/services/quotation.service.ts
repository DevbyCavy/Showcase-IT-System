// Translated from createQuotation.php/updateQuotation.php (submission open to any authenticated
// user — see MIGRATION_PLAN.md §10 on why "Marketer" no longer gates this) and
// processQuotation.php/processQuotations.php (Super-Admin-only approval).

import { ApiError } from '../middleware/errorHandler'
import * as quotationRepository from '../repositories/quotation.repository'
import type { QuotationBody } from '../validations/quotation.validation'
import { toPublicUser } from '../utils/mapUser'
import type { AuthenticatedUser } from '../types/auth.types'

export const DEFAULT_TERMS = [
  '1. Invoice valid for 14 working days.',
  '2. Payment required before commencement.',
  '3. This is not a hire price but a hire purchase.',
  '4. Artwork must be confirmed no later than 14 days before the event.',
  '5. Artwork must be sent in high resolution PDF/EPS.',
  '6. Payable in USD.',
].join('\n')

function toPublicQuotation(q: Awaited<ReturnType<typeof quotationRepository.findAll>>[number]) {
  return {
    id: q.id,
    quotationNumber: q.quotationNumber,
    customerName: q.customerName,
    customerId: q.customerId,
    projectName: q.projectName,
    orderNumber: q.orderNumber,
    quoteDate: q.quoteDate,
    termsConditions: q.termsConditions,
    designFile: q.designFile,
    subtotal: q.subtotal,
    applyVat: q.applyVat,
    vatAmount: q.vatAmount,
    total: q.total,
    status: q.status,
    submittedBy: toPublicUser(q.submittedBy),
    approvedBy: q.approvedBy ? toPublicUser(q.approvedBy) : null,
    approvedAt: q.approvedAt,
    rejectedBy: q.rejectedBy ? toPublicUser(q.rejectedBy) : null,
    rejectedAt: q.rejectedAt,
    rejectionReason: q.rejectionReason,
    createdAt: q.createdAt,
    items: q.items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      sortOrder: i.sortOrder,
    })),
  }
}

export async function list() {
  const quotations = await quotationRepository.findAll()
  return quotations.map(toPublicQuotation)
}

export async function getOne(id: number) {
  const quotation = await quotationRepository.findById(id)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  return toPublicQuotation(quotation)
}

// Returns the full Prisma row (with items + submittedBy) for the PDF renderer, which needs the
// real Decimal/Date values rather than the JSON-shaped public view. The PDF is what actually goes
// to the client, so it's gated to Approved — a Marketer's quotation must clear Super Admin
// approval before it can be sent out, not just before it's marked Approved in the UI.
export async function getForPdf(id: number) {
  const quotation = await quotationRepository.findById(id)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  if (quotation.status !== 'Approved') {
    throw new ApiError(403, 'This quotation must be approved by Super Admin before it can be sent to the client.')
  }
  return quotation
}

// Same full row as getForPdf, but for the browser preview (View button) rather than the
// client-facing PDF — a Marketer previewing their own Pending or Rejected quotation isn't "sending
// it to the client", so this isn't gated to Approved.
export async function getForView(id: number) {
  const quotation = await quotationRepository.findById(id)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  return quotation
}

export async function create(input: QuotationBody, submittedById: number, designFile?: string) {
  const quotation = await quotationRepository.create({
    customerName: input.customerName,
    customerId: input.customerId,
    projectName: input.projectName,
    orderNumber: input.orderNumber,
    quoteDate: input.quoteDate,
    termsConditions: input.termsConditions || DEFAULT_TERMS,
    designFile,
    submittedById,
    applyVat: input.applyVat,
    items: input.items,
  })
  return toPublicQuotation(quotation)
}

// Super Admin can edit any quotation, any status (legacy editQuotation.php behavior). The
// submitting Marketer may only fix their own quotation while it's still Pending — once Super
// Admin approves it, it's locked to them (Marketer's own confirmation of intent, matching the
// approve flow's one-way Pending -> Approved transition).
export async function update(id: number, input: QuotationBody, editor: AuthenticatedUser, designFile?: string) {
  const existing = await quotationRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Quotation not found.')
  }
  if (editor.role !== 'SuperAdmin') {
    if (existing.submittedById !== editor.id) {
      throw new ApiError(403, 'You can only edit your own quotations.')
    }
    if (existing.status === 'Approved') {
      throw new ApiError(403, 'This quotation has already been approved and can no longer be edited.')
    }
  }
  // Editing a Rejected quotation is treated as a resubmission — it re-enters the Pending queue
  // rather than staying Rejected with stale edits underneath it.
  const quotation = await quotationRepository.update(
    id,
    {
      customerName: input.customerName,
      customerId: input.customerId,
      projectName: input.projectName,
      orderNumber: input.orderNumber,
      quoteDate: input.quoteDate,
      termsConditions: input.termsConditions || DEFAULT_TERMS,
      designFile,
      applyVat: input.applyVat,
      items: input.items,
    },
    existing.status === 'Rejected',
  )
  return toPublicQuotation(quotation)
}

export async function approve(id: number, approvedById: number) {
  const quotation = await quotationRepository.findById(id)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  const approved = await quotationRepository.markApproved(id, approvedById)
  if (!approved) {
    throw new ApiError(400, 'Could not approve — already approved or not found.')
  }
  return toPublicQuotation((await quotationRepository.findById(id))!)
}

export async function reject(id: number, rejectedById: number, reason: string) {
  const quotation = await quotationRepository.findById(id)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  const rejected = await quotationRepository.markRejected(id, rejectedById, reason)
  if (!rejected) {
    throw new ApiError(400, 'Could not reject — already processed or not found.')
  }
  return toPublicQuotation((await quotationRepository.findById(id))!)
}
