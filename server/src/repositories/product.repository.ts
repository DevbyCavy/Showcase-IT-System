import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'

// Mirrors fetchProduct.php: `WHERE product.status = 1`, joined with brand/category names.
export function findAllActive() {
  return prisma.product.findMany({
    where: { status: 'Active' },
    include: { brand: true, category: true },
  })
}

export function findById(id: number) {
  return prisma.product.findUnique({ where: { id }, include: { brand: true, category: true } })
}

export interface ProductCreateData {
  name: string
  imageUrl: string
  brandId: number
  categoryId: number
  quantity: number
  rate: number
  isActive: boolean
}

export function create(data: ProductCreateData) {
  return prisma.product.create({
    data: { ...data, code: '', status: 'Active' },
    include: { brand: true, category: true },
  })
}

export interface ProductUpdateData {
  name: string
  brandId: number
  categoryId: number
  quantity: number
  rate: number
  isActive: boolean
}

export interface FulfilledShortfall {
  requisitionId: number
  reqNumber: string
  amountFulfilled: number
  fullyFulfilled: boolean
}

// When restocking covers part or all of a product's outstanding BOQ shortfalls, per Calvin's
// explicit request (see MIGRATION_PLAN.md §30): consumes `increase` units against Pending Product
// requisitions for this product, oldest first (FIFO). Each requisition's remaining quantity is
// reduced by however much of the increase it soaks up; if that brings it to 0 it's marked
// Processed and its linked BoqItem (if any) flips to Fulfilled. Returns how much of the increase
// got consumed this way, so the caller can net it out of the final stock figure — restocked units
// that immediately cover a backlog were never really "added" to visible stock.
async function fulfillShortfallsInTx(tx: Prisma.TransactionClient, productId: number, increase: number) {
  let remaining = increase
  let totalApplied = 0
  const fulfilled: FulfilledShortfall[] = []
  if (increase <= 0) return { totalApplied, fulfilled }

  const pendingReqs = await tx.requisition.findMany({
    where: { reqType: 'Product', productId, status: 'Pending' },
    orderBy: { createdAt: 'asc' },
  })

  for (const req of pendingReqs) {
    if (remaining <= 0) break
    const reqQty = Number(req.quantity ?? 0)
    const applied = Math.min(remaining, reqQty)
    if (applied <= 0) continue

    const newReqQty = reqQty - applied
    const fullyFulfilled = newReqQty <= 0

    await tx.requisition.update({
      where: { id: req.id },
      data: fullyFulfilled ? { quantity: 0, status: 'Processed', processedAt: new Date() } : { quantity: newReqQty },
    })

    if (fullyFulfilled && req.boqItemId) {
      await tx.boqItem.update({ where: { id: req.boqItemId }, data: { status: 'Fulfilled' } })
    }

    fulfilled.push({ requisitionId: req.id, reqNumber: req.reqNumber, amountFulfilled: applied, fullyFulfilled })
    remaining -= applied
    totalApplied += applied
  }

  return { totalApplied, fulfilled }
}

// Mirrors editProduct.php: name/brand/category/quantity/rate/active only — never touches the image.
// Wrapped in a transaction with fulfillShortfallsInTx so raising the quantity here (the Manage
// Products edit form) can fulfill outstanding BOQ shortfalls the same way the Store page's +/-
// buttons do (see updateQuantity below).
export async function update(id: number, data: ProductUpdateData) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUniqueOrThrow({ where: { id } })
    const increase = Math.max(0, data.quantity - existing.quantity)
    const { totalApplied, fulfilled } = await fulfillShortfallsInTx(tx, id, increase)
    const product = await tx.product.update({
      where: { id },
      data: { ...data, quantity: data.quantity - totalApplied },
      include: { brand: true, category: true },
    })
    return { product, fulfilled }
  })
}

// Mirrors editProductImage.php: the image is updated independently of the rest of the product.
export function updateImage(id: number, imageUrl: string) {
  return prisma.product.update({ where: { id }, data: { imageUrl } })
}

// Mirrors updateQuantity.php — used by the Inventory/Issued Tools module (Module 7) and the
// Store page's +/- buttons. See fulfillShortfallsInTx above for the restock-fulfills-shortfalls
// behavior — the net quantity actually saved is `quantity - totalApplied`, since units consumed
// by a backlog were never really added to visible stock.
export async function updateQuantity(id: number, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUniqueOrThrow({ where: { id } })
    const increase = Math.max(0, quantity - existing.quantity)
    const { totalApplied, fulfilled } = await fulfillShortfallsInTx(tx, id, increase)
    const product = await tx.product.update({
      where: { id },
      data: { quantity: quantity - totalApplied },
      include: { brand: true, category: true },
    })
    return { product, fulfilled }
  })
}

// Mirrors store.php's grid query: `WHERE p.active = 1 AND p.status = 1` — narrower than
// fetchProduct.php's plain `status = 1` (Manage Products shows both Available/Not Available rows;
// the issuing grid only shows stock that's actually Available).
export function findAllAvailableForIssue() {
  return prisma.product.findMany({
    where: { status: 'Active', isActive: true },
    include: { brand: true, category: true },
  })
}

// Mirrors removeProduct.php: `active = 2, status = 2` — both the business flag and the
// soft-delete flag get flipped on removal (unlike brand/category, which only touch status).
export function softDelete(id: number) {
  return prisma.product.update({ where: { id }, data: { isActive: false, status: 'Deleted' } })
}
