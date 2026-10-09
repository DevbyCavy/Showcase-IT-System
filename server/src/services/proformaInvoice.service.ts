// Proforma invoices & payments — see MIGRATION_PLAN.md §34. Confirming a client approval (from the
// quotation side) creates one invoice per quotation; Finance (Accountant) + Super Admin view
// invoices and record payments, each payment getting its own receipt.

import { Prisma } from '#prisma-client'
import { ApiError } from '../middleware/errorHandler'
import * as invoiceRepository from '../repositories/proformaInvoice.repository'
import type { PaymentWithRelations, ProformaInvoiceWithRelations } from '../repositories/proformaInvoice.repository'
import * as quotationRepository from '../repositories/quotation.repository'
import type { InvoiceListQuery, RecordPaymentBody } from '../validations/proformaInvoice.validation'
import { toPublicUser } from '../utils/mapUser'
import { todayDateOnly, addDays } from '../utils/workDate'
import type { AuthenticatedUser } from '../types/auth.types'

function toPublicPayment(p: Omit<PaymentWithRelations, 'invoice'>) {
  return {
    id: p.id,
    receiptNumber: p.receiptNumber,
    invoiceId: p.invoiceId,
    amount: p.amount,
    paymentDate: p.paymentDate,
    method: p.method,
    reference: p.reference,
    notes: p.notes,
    balanceAfter: p.balanceAfter,
    recordedBy: toPublicUser(p.recordedBy),
    createdAt: p.createdAt,
  }
}

function toPublicInvoice(inv: ProformaInvoiceWithRelations) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    quotation: {
      id: inv.quotation.id,
      quotationNumber: inv.quotation.quotationNumber,
      clientApprovedAt: inv.quotation.clientApprovedAt,
      clientApprovedBy: inv.quotation.clientApprovedBy ? toPublicUser(inv.quotation.clientApprovedBy) : null,
    },
    customerName: inv.customerName,
    customerId: inv.customerId,
    projectName: inv.projectName,
    orderNumber: inv.orderNumber,
    termsConditions: inv.termsConditions,
    currency: inv.currency,
    subtotal: inv.subtotal,
    applyVat: inv.applyVat,
    vatAmount: inv.vatAmount,
    total: inv.total,
    amountPaid: inv.amountPaid,
    balanceDue: inv.total.minus(inv.amountPaid),
    paymentStatus: inv.paymentStatus,
    issuedAt: inv.issuedAt,
    createdBy: toPublicUser(inv.createdBy),
    items: inv.items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    payments: inv.payments.map(toPublicPayment),
  }
}

// Super Admin may confirm any quotation; a Marketer only their own (same ownership rule as
// quotation editing). The quotation must already carry Super Admin's internal approval — that's
// the gate on sending it to the client in the first place.
export async function confirmClientApproval(quotationId: number, user: AuthenticatedUser) {
  const quotation = await quotationRepository.findById(quotationId)
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found.')
  }
  if (user.role !== 'SuperAdmin' && quotation.submittedById !== user.id) {
    throw new ApiError(403, 'You can only confirm client approval on your own quotations.')
  }
  if (quotation.status !== 'Approved') {
    throw new ApiError(400, 'Only a quotation already approved by Super Admin can be marked as client-approved.')
  }
  if (!quotation.total.gt(0)) {
    throw new ApiError(400, 'This quotation has no amount to invoice.')
  }

  const result = await invoiceRepository.createFromClientApproval(quotationId, user.id)
  if (result.kind === 'ineligible') {
    throw new ApiError(409, 'This quotation is no longer eligible for client approval. Refresh and try again.')
  }
  return {
    created: result.kind === 'created',
    invoice: { id: result.invoice.id, invoiceNumber: result.invoice.invoiceNumber },
  }
}

export async function list(query: InvoiceListQuery) {
  const pageSize = query.pageSize
  const { invoices, total, statusGroups } = await invoiceRepository.findMany({
    paymentStatus: query.status,
    search: query.search,
    take: pageSize,
    skip: pageSize && query.page ? (query.page - 1) * pageSize : undefined,
  })
  const counts = { Unpaid: 0, Deposited: 0, FullyPaid: 0 }
  for (const g of statusGroups) counts[g.paymentStatus] = g._count
  return { invoices: invoices.map(toPublicInvoice), total, counts }
}

async function findOrThrow(id: number) {
  const invoice = await invoiceRepository.findById(id)
  if (!invoice) {
    throw new ApiError(404, 'Proforma invoice not found.')
  }
  return invoice
}

export async function getOne(id: number) {
  const invoice = await findOrThrow(id)
  const trail = await invoiceRepository.findAuditTrail(
    invoice.id,
    invoice.quotationId,
    invoice.payments.map((p) => p.id),
  )
  return {
    ...toPublicInvoice(invoice),
    auditTrail: trail.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      metadata: a.metadata,
      actor: toPublicUser(a.actor),
      createdAt: a.createdAt,
    })),
  }
}

export async function recordPayment(invoiceId: number, input: RecordPaymentBody, user: AuthenticatedUser) {
  // Allow one day of slack for timezone differences between the browser and the server clock.
  if (input.paymentDate > addDays(todayDateOnly(), 1)) {
    throw new ApiError(400, 'Payment date cannot be in the future.')
  }

  const result = await invoiceRepository.recordPayment({
    invoiceId,
    amount: new Prisma.Decimal(input.amount),
    paymentDate: input.paymentDate,
    method: input.method,
    reference: input.reference,
    notes: input.notes,
    idempotencyKey: input.idempotencyKey,
    recordedById: user.id,
  })

  switch (result.kind) {
    case 'notFound':
      throw new ApiError(404, 'Proforma invoice not found.')
    case 'keyConflict':
      throw new ApiError(409, 'This submission was already used for a different invoice. Reopen the form and try again.')
    case 'exceedsBalance':
      throw new ApiError(
        400,
        result.balance.lte(0)
          ? 'This invoice is already fully paid.'
          : `Amount exceeds the outstanding balance of ${result.balance.toFixed(2)}. Overpayments are not accepted.`,
      )
  }

  const invoice = await findOrThrow(invoiceId)
  return {
    duplicate: result.kind === 'duplicate',
    payment: toPublicPayment(result.payment),
    invoice: toPublicInvoice(invoice),
  }
}

export async function getForPdf(id: number, user: AuthenticatedUser) {
  const invoice = await findOrThrow(id)
  await invoiceRepository.audit({
    actorId: user.id,
    action: 'proforma_invoice.document_generated',
    entityType: 'ProformaInvoice',
    entityId: invoice.id,
    metadata: { invoiceNumber: invoice.invoiceNumber },
  })
  return invoice
}

export async function getPaymentForReceipt(paymentId: number, user: AuthenticatedUser) {
  const payment = await invoiceRepository.findPaymentById(paymentId)
  if (!payment) {
    throw new ApiError(404, 'Payment not found.')
  }
  await invoiceRepository.audit({
    actorId: user.id,
    action: 'receipt.generated',
    entityType: 'Payment',
    entityId: payment.id,
    metadata: { receiptNumber: payment.receiptNumber, invoiceNumber: payment.invoice.invoiceNumber },
  })
  return payment
}
