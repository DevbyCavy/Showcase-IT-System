import type { Prisma } from '#prisma-client'
import { prisma } from '../config/prisma'

const include = { items: { include: { product: true } } } as const

export function findAll() {
  return prisma.boq.findMany({ include, orderBy: { id: 'desc' } })
}

export function findById(id: number) {
  return prisma.boq.findUnique({ where: { id }, include })
}

// Mirrors createBOQ.php: `SELECT MAX(CAST(boq_number AS UNSIGNED)) ... ` — plain zero-padded
// numeric sequence, same convention as orders (NOT the "REQ-###" style requisitions use).
export async function nextBoqNumber() {
  const last = await prisma.boq.findFirst({ orderBy: { boqNumber: 'desc' } })
  const maxNo = last ? parseInt(last.boqNumber, 10) || 0 : 0
  return String(maxNo + 1).padStart(3, '0')
}

// Same max+1 pattern as requisition.repository.ts#nextReqNumber, duplicated here (rather than
// reusing that function) because this one needs to run against the transaction client so
// sequential numbers stay correct when a single BOQ files multiple shortfall requisitions.
async function nextReqNumberTx(tx: Prisma.TransactionClient) {
  const last = await tx.requisition.findFirst({ orderBy: { reqNumber: 'desc' } })
  const maxNo = last ? parseInt(last.reqNumber.slice(4), 10) || 0 : 0
  return `REQ-${String(maxNo + 1).padStart(3, '0')}`
}

export interface BoqItemCreateData {
  productId: number
  description?: string
  unit?: string
  quantity: number
}

export interface BoqCreateData {
  orderId: number
  orderNumber: string
  eventName: string
  clientName?: string
  location: string
  createdById: number
  createdByName: string
  items: BoqItemCreateData[]
}

export interface BoqCreateResult {
  boq: NonNullable<Awaited<ReturnType<typeof findById>>>
  shortfallCount: number
}

// Filling a BOQ deducts each item's quantity from Store stock (Product.quantity), capped at
// what's actually available — never negative. Any shortfall (requested > available) automatically
// files a Pending Requisition (reqType Product, carrying productId + the missing quantity, linked
// back to its BoqItem via boqItemId) so Stores knows what to reorder, per Calvin's explicit
// request (see MIGRATION_PLAN.md §29) — and so a later restock can find and fulfill it (§30). Each
// item's status is Pending if it has a shortfall, Fulfilled otherwise. Items are created
// individually (not via one nested `items: { create: [...] }`) because the shortfall requisition
// needs a real BoqItem id to link to before it exists. All of this — the BOQ, every item, every
// stock decrement, and every shortfall requisition — happens in one transaction: either it all
// commits or none of it does.
export async function create(data: BoqCreateData): Promise<BoqCreateResult> {
  const boqNumber = await nextBoqNumber()

  const { boqId, shortfallCount } = await prisma.$transaction(async (tx) => {
    let shortfallCount = 0

    const created = await tx.boq.create({
      data: {
        boqNumber,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        eventName: data.eventName,
        clientName: data.clientName,
        location: data.location,
        createdById: data.createdById,
      },
    })

    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      // Product.quantity is a whole-unit stock count (Int); BoqItem.quantity allows fractional
      // amounts (Decimal, e.g. "2.5 rolls"). Round up what's "needed" from stock so Prisma never
      // sees a fractional value for the Int column, and a partial unit still counts as needing a
      // whole one out of stock.
      const available = product.quantity
      const neededWhole = Math.ceil(item.quantity)
      const deduct = Math.min(neededWhole, available)
      const shortfall = item.quantity - deduct

      if (deduct > 0) {
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { decrement: deduct } } })
      }

      const boqItem = await tx.boqItem.create({
        data: {
          boqId: created.id,
          productId: item.productId,
          productName: product.name,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          status: shortfall > 0 ? 'Pending' : 'Fulfilled',
        },
      })

      if (shortfall > 0) {
        shortfallCount++
        const reqNumber = await nextReqNumberTx(tx)
        await tx.requisition.create({
          data: {
            reqNumber,
            projectManager: data.createdByName,
            eventName: `BOQ ${boqNumber} — ${product.name} shortfall`,
            location: data.location,
            eventDate: new Date(),
            reqType: 'Product',
            productId: item.productId,
            boqItemId: boqItem.id,
            quantity: shortfall,
            submittedById: data.createdById,
            status: 'Pending',
          },
        })
      }
    }

    return { boqId: created.id, shortfallCount }
  })

  const boq = await findById(boqId)
  return { boq: boq!, shortfallCount }
}
