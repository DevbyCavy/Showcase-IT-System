import { Prisma, type InvoicePaymentStatus, type PaymentMethod } from '#prisma-client'
import { prisma } from '../config/prisma'

const Decimal = Prisma.Decimal
type Decimal = Prisma.Decimal

const include = {
  quotation: { select: { id: true, quotationNumber: true, clientApprovedAt: true, clientApprovedBy: true } },
  createdBy: true,
  items: { orderBy: { sortOrder: 'asc' as const } },
  payments: { include: { recordedBy: true }, orderBy: { id: 'asc' as const } },
} satisfies Prisma.ProformaInvoiceInclude

export type ProformaInvoiceWithRelations = Prisma.ProformaInvoiceGetPayload<{ include: typeof include }>

const paymentInclude = {
  recordedBy: true,
  invoice: { include: { quotation: { select: { id: true, quotationNumber: true } } } },
} satisfies Prisma.PaymentInclude

export type PaymentWithRelations = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>

// Unpaid / Deposited / Fully Paid is always derived from the amounts — Decimal comparisons, never
// JS float equality. Overpayments are rejected upstream, so paid > total can't occur.
export function derivePaymentStatus(total: Decimal, paid: Decimal): InvoicePaymentStatus {
  if (paid.lte(0)) return 'Unpaid'
  if (paid.gte(total)) return 'FullyPaid'
  return 'Deposited'
}

// Concurrency-safe "PI-001"/"RCT-001" numbering (zero-padded like QUO-001). The upsert row-locks
// the counter until the transaction commits, so concurrent callers queue instead of colliding,
// and a rolled-back transaction gives its number back.
async function nextNumberTx(tx: Prisma.TransactionClient, prefix: 'PI' | 'RCT') {
  const rows = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO "document_counters" ("key", "lastValue") VALUES (${prefix}, 1)
    ON CONFLICT ("key") DO UPDATE SET "lastValue" = "document_counters"."lastValue" + 1
    RETURNING "lastValue"`
  return `${prefix}-${String(rows[0].lastValue).padStart(3, '0')}`
}

interface AuditEntry {
  actorId: number
  action: string
  entityType: 'Quotation' | 'ProformaInvoice' | 'Payment'
  entityId: number
  metadata?: Prisma.InputJsonValue
}

function auditTx(tx: Prisma.TransactionClient, entry: AuditEntry) {
  return tx.auditLog.create({ data: entry })
}

export function audit(entry: AuditEntry) {
  return prisma.auditLog.create({ data: entry })
}

function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export type ClientApprovalResult =
  | { kind: 'created'; invoice: ProformaInvoiceWithRelations }
  | { kind: 'existing'; invoice: ProformaInvoiceWithRelations }
  | { kind: 'ineligible' }

// One transaction: claim the quotation (conditional update — only an internally Approved,
// not-yet-client-approved row matches, so a concurrent second request blocks on the row lock and
// then matches nothing), snapshot it into a new invoice, and audit both steps. A retry or a
// concurrent duplicate gets the already-created invoice back; the unique index on quotationId is
// the final backstop if anything slips past the conditional update.
export async function createFromClientApproval(quotationId: number, userId: number): Promise<ClientApprovalResult> {
  try {
    return await prisma.$transaction(async (tx): Promise<ClientApprovalResult> => {
      const now = new Date()
      const claimed = await tx.quotation.updateMany({
        where: { id: quotationId, status: 'Approved', clientApprovedAt: null },
        data: { clientApprovedAt: now, clientApprovedById: userId },
      })
      if (claimed.count === 0) {
        const existing = await tx.proformaInvoice.findUnique({ where: { quotationId }, include })
        return existing ? { kind: 'existing', invoice: existing } : { kind: 'ineligible' }
      }

      const q = await tx.quotation.findUniqueOrThrow({
        where: { id: quotationId },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      })
      const invoiceNumber = await nextNumberTx(tx, 'PI')
      const invoice = await tx.proformaInvoice.create({
        data: {
          invoiceNumber,
          quotationId,
          customerName: q.customerName,
          customerId: q.customerId,
          projectName: q.projectName,
          orderNumber: q.orderNumber,
          termsConditions: q.termsConditions,
          subtotal: q.subtotal,
          applyVat: q.applyVat,
          vatAmount: q.vatAmount,
          total: q.total,
          createdById: userId,
          items: {
            create: q.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
              sortOrder: i.sortOrder,
            })),
          },
        },
        include,
      })

      await auditTx(tx, {
        actorId: userId,
        action: 'quotation.client_approved',
        entityType: 'Quotation',
        entityId: quotationId,
        metadata: { quotationNumber: q.quotationNumber, invoiceNumber },
      })
      await auditTx(tx, {
        actorId: userId,
        action: 'proforma_invoice.created',
        entityType: 'ProformaInvoice',
        entityId: invoice.id,
        metadata: { invoiceNumber, quotationNumber: q.quotationNumber, total: q.total.toFixed(2) },
      })
      return { kind: 'created', invoice }
    })
  } catch (err) {
    if (!isUniqueViolation(err)) throw err
    const existing = await prisma.proformaInvoice.findUnique({ where: { quotationId }, include })
    if (!existing) throw err
    return { kind: 'existing', invoice: existing }
  }
}

export interface InvoiceListFilters {
  paymentStatus?: InvoicePaymentStatus
  search?: string
  skip?: number
  take?: number
}

function listWhere(filters: InvoiceListFilters): Prisma.ProformaInvoiceWhereInput {
  const search = filters.search?.trim()
  return {
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { projectName: { contains: search, mode: 'insensitive' } },
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { quotation: { quotationNumber: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }
}

export async function findMany(filters: InvoiceListFilters) {
  const where = listWhere(filters)
  const [invoices, total, statusGroups] = await Promise.all([
    prisma.proformaInvoice.findMany({ where, include, orderBy: { id: 'desc' }, skip: filters.skip, take: filters.take }),
    prisma.proformaInvoice.count({ where }),
    // Tab counts ignore the status filter itself (so every tab shows its own count) but respect
    // the search box.
    prisma.proformaInvoice.groupBy({ by: ['paymentStatus'], where: listWhere({ search: filters.search }), _count: true }),
  ])
  return { invoices, total, statusGroups }
}

export function findById(id: number) {
  return prisma.proformaInvoice.findUnique({ where: { id }, include })
}

export function findPaymentById(id: number) {
  return prisma.payment.findUnique({ where: { id }, include: paymentInclude })
}

// Audit trail for one invoice: its own entries, its payments', and its source quotation's
// client-approval entry.
export function findAuditTrail(invoiceId: number, quotationId: number, paymentIds: number[]) {
  return prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: 'ProformaInvoice', entityId: invoiceId },
        { entityType: 'Quotation', entityId: quotationId, action: 'quotation.client_approved' },
        ...(paymentIds.length ? [{ entityType: 'Payment', entityId: { in: paymentIds } }] : []),
      ],
    },
    include: { actor: true },
    orderBy: { createdAt: 'asc' },
  })
}

export interface PaymentCreateData {
  invoiceId: number
  amount: Decimal
  paymentDate: Date
  method: PaymentMethod
  reference?: string
  notes?: string
  idempotencyKey: string
  recordedById: number
}

export type RecordPaymentResult =
  | { kind: 'recorded'; payment: PaymentWithRelations }
  | { kind: 'duplicate'; payment: PaymentWithRelations }
  | { kind: 'notFound' }
  | { kind: 'keyConflict' }
  | { kind: 'exceedsBalance'; balance: Decimal }

// Locks the invoice row (SELECT ... FOR UPDATE) before reading the paid total, so two concurrent
// payments against the same invoice are serialized — the second sees the first's amount and can't
// push the invoice past its total. amountPaid/paymentStatus are recalculated from the persisted
// payment rows in that same transaction. A repeated idempotencyKey returns the original payment.
export async function recordPayment(data: PaymentCreateData): Promise<RecordPaymentResult> {
  const findByKey = () => prisma.payment.findUnique({ where: { idempotencyKey: data.idempotencyKey }, include: paymentInclude })
  const asDuplicate = (payment: PaymentWithRelations): RecordPaymentResult =>
    payment.invoiceId === data.invoiceId ? { kind: 'duplicate', payment } : { kind: 'keyConflict' }

  const prior = await findByKey()
  if (prior) return asDuplicate(prior)

  try {
    return await prisma.$transaction(async (tx): Promise<RecordPaymentResult> => {
      const locked = await tx.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "proforma_invoices" WHERE "id" = ${data.invoiceId} FOR UPDATE`
      if (locked.length === 0) return { kind: 'notFound' }

      const invoice = await tx.proformaInvoice.findUniqueOrThrow({ where: { id: data.invoiceId } })
      const sum = await tx.payment.aggregate({ where: { invoiceId: data.invoiceId }, _sum: { amount: true } })
      const paidBefore = sum._sum.amount ?? new Decimal(0)
      const balance = invoice.total.minus(paidBefore)
      if (data.amount.gt(balance)) return { kind: 'exceedsBalance', balance }

      const paidAfter = paidBefore.plus(data.amount)
      const receiptNumber = await nextNumberTx(tx, 'RCT')
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          invoiceId: data.invoiceId,
          amount: data.amount,
          paymentDate: data.paymentDate,
          method: data.method,
          reference: data.reference,
          notes: data.notes,
          balanceAfter: invoice.total.minus(paidAfter),
          idempotencyKey: data.idempotencyKey,
          recordedById: data.recordedById,
        },
        include: paymentInclude,
      })
      const paymentStatus = derivePaymentStatus(invoice.total, paidAfter)
      await tx.proformaInvoice.update({ where: { id: data.invoiceId }, data: { amountPaid: paidAfter, paymentStatus } })
      await auditTx(tx, {
        actorId: data.recordedById,
        action: 'payment.recorded',
        entityType: 'Payment',
        entityId: payment.id,
        metadata: {
          receiptNumber,
          invoiceNumber: invoice.invoiceNumber,
          amount: data.amount.toFixed(2),
          balanceAfter: payment.balanceAfter.toFixed(2),
          paymentStatus,
        },
      })
      return { kind: 'recorded', payment }
    })
  } catch (err) {
    // Same idempotency key submitted concurrently: the loser's insert hits the unique index and its
    // whole transaction (counter bump included) rolls back — hand back the winner's payment.
    if (!isUniqueViolation(err)) throw err
    const winner = await findByKey()
    if (!winner) throw err
    return asDuplicate(winner)
  }
}
