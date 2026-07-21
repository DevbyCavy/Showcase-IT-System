// Translated from createQuotation.php/updateQuotation.php (submission open to any authenticated
// user — see MIGRATION_PLAN.md §10 on why "Marketer" no longer gates this) and
// processQuotation.php/processQuotations.php (Super-Admin-only approval).

import { ApiError } from '../middleware/errorHandler'
import * as quotationRepository from '../repositories/quotation.repository'
import type { QuotationBody } from '../validations/quotation.validation'
import { toPublicUser } from '../utils/mapUser'

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
    total: q.total,
    status: q.status,
    submittedBy: toPublicUser(q.submittedBy),
    approvedBy: q.approvedBy ? toPublicUser(q.approvedBy) : null,
    approvedAt: q.approvedAt,
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
// real Decimal/Date values rather than the JSON-shaped public view.
export async function getForPdf(id: number) {
  const quotation = await quotationRepository.findById(id)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  return quotation
}

export async function create(input: QuotationBody, submittedById: number, designFile: string) {
  const quotation = await quotationRepository.create({
    customerName: input.customerName,
    customerId: input.customerId,
    projectName: input.projectName,
    orderNumber: input.orderNumber,
    quoteDate: input.quoteDate,
    termsConditions: input.termsConditions || DEFAULT_TERMS,
    designFile,
    submittedById,
    items: input.items,
  })
  return toPublicQuotation(quotation)
}

export async function update(id: number, input: QuotationBody, designFile?: string) {
  const existing = await quotationRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Quotation not found.')
  }
  const quotation = await quotationRepository.update(id, {
    customerName: input.customerName,
    customerId: input.customerId,
    projectName: input.projectName,
    orderNumber: input.orderNumber,
    quoteDate: input.quoteDate,
    termsConditions: input.termsConditions || DEFAULT_TERMS,
    designFile,
    items: input.items,
  })
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
