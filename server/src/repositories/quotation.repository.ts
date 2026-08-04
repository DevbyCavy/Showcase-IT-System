import { prisma } from '../config/prisma'

const include = {
  submittedBy: true,
  approvedBy: true,
  items: { orderBy: { sortOrder: 'asc' as const } },
}

export function findAll() {
  return prisma.quotation.findMany({ include, orderBy: { createdAt: 'desc' } })
}

export function findById(id: number) {
  return prisma.quotation.findUnique({ where: { id }, include })
}

// Mirrors createQuotation.php: `MAX(CAST(SUBSTRING(quotation_number, 5) AS UNSIGNED))` -> "QUO-001", ...
export async function nextQuoNumber() {
  const last = await prisma.quotation.findFirst({ orderBy: { quotationNumber: 'desc' } })
  const maxNo = last ? parseInt(last.quotationNumber.slice(4), 10) || 0 : 0
  return `QUO-${String(maxNo + 1).padStart(3, '0')}`
}

export interface QuotationItemInput {
  description: string
  quantity: number
  unitPrice: number
}

// Optional VAT, on top of the line-items subtotal — see MIGRATION_PLAN.md's quotation VAT entry.
export const VAT_RATE = 0.155

function vatOf(subtotal: number, applyVat: boolean) {
  return applyVat ? subtotal * VAT_RATE : 0
}

export interface QuotationCreateData {
  customerName: string
  customerId?: string
  projectName?: string
  orderNumber?: string
  quoteDate: Date
  termsConditions: string
  designFile: string
  submittedById: number
  applyVat: boolean
  items: QuotationItemInput[]
}

function lineTotalsOf(items: QuotationItemInput[]) {
  return items.map((i) => ({ ...i, lineTotal: i.quantity * i.unitPrice }))
}

export async function create(data: QuotationCreateData) {
  const quotationNumber = await nextQuoNumber()
  const withTotals = lineTotalsOf(data.items)
  const subtotal = withTotals.reduce((sum, i) => sum + i.lineTotal, 0)
  const vatAmount = vatOf(subtotal, data.applyVat)

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      customerName: data.customerName,
      customerId: data.customerId,
      projectName: data.projectName,
      orderNumber: data.orderNumber,
      quoteDate: data.quoteDate,
      termsConditions: data.termsConditions,
      designFile: data.designFile,
      subtotal,
      applyVat: data.applyVat,
      vatAmount,
      total: subtotal + vatAmount,
      submittedById: data.submittedById,
      status: 'Pending',
      items: {
        create: withTotals.map((i, sortOrder) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          sortOrder,
        })),
      },
    },
    include,
  })
  return quotation
}

export interface QuotationUpdateData {
  customerName: string
  customerId?: string
  projectName?: string
  orderNumber?: string
  quoteDate: Date
  termsConditions: string
  designFile?: string
  applyVat: boolean
  items: QuotationItemInput[]
}

// Mirrors updateQuotation.php: delete + reinsert items, keep design_file unless a new one was uploaded.
export async function update(id: number, data: QuotationUpdateData) {
  const withTotals = lineTotalsOf(data.items)
  const subtotal = withTotals.reduce((sum, i) => sum + i.lineTotal, 0)
  const vatAmount = vatOf(subtotal, data.applyVat)

  return prisma.$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } })
    const quotation = await tx.quotation.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerId: data.customerId,
        projectName: data.projectName,
        orderNumber: data.orderNumber,
        quoteDate: data.quoteDate,
        termsConditions: data.termsConditions,
        ...(data.designFile ? { designFile: data.designFile } : {}),
        subtotal,
        applyVat: data.applyVat,
        vatAmount,
        total: subtotal + vatAmount,
        items: {
          create: withTotals.map((i, sortOrder) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
            sortOrder,
          })),
        },
      },
      include,
    })
    return quotation
  })
}

// Mirrors processQuotation.php's `WHERE status = 'Pending'` guard: atomic, so a quotation can never
// be approved twice under concurrent clicks.
export async function markApproved(id: number, approvedById: number) {
  const result = await prisma.quotation.updateMany({
    where: { id, status: 'Pending' },
    data: { status: 'Approved', approvedById, approvedAt: new Date() },
  })
  return result.count > 0
}
