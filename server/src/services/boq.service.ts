// Translated from createBOQ.php (order-linked, multi-row items, auto-numbered like orders) and
// downloadBOQ.php (DOMPDF -> Puppeteer, see utils/pdf.ts). Scoped from feature/boq-stock-requisitions
// per MIGRATION_PLAN.md §2.1 — main never had a working create path for this table.

import { ApiError } from '../middleware/errorHandler'
import * as boqRepository from '../repositories/boq.repository'
import * as orderRepository from '../repositories/order.repository'
import * as userRepository from '../repositories/user.repository'
import type { BoqBody } from '../validations/boq.validation'

export function list() {
  return boqRepository.findAll()
}

export async function getOne(id: number) {
  const boq = await boqRepository.findById(id)
  if (!boq) {
    throw new ApiError(404, 'BOQ not found')
  }
  return boq
}

// Returns { boq, shortfallCount } — shortfallCount is how many items didn't have enough stock and
// got an auto-filed Product requisition instead (see boq.repository.ts#create), so the client can
// tell the user "N items were short and requisitioned."
export async function create(input: BoqBody, createdById: number) {
  const order = await orderRepository.findById(input.orderId)
  if (!order) {
    throw new ApiError(400, 'Selected order could not be found')
  }
  const creator = await userRepository.findById(createdById)

  return boqRepository.create({
    orderId: input.orderId,
    orderNumber: order.orderNumber,
    eventName: input.eventName,
    clientName: input.clientName,
    location: input.location,
    createdById,
    createdByName: creator ? `${creator.name} ${creator.surname}` : 'Unknown',
    items: input.items.map((i) => ({
      productId: i.productId,
      description: i.description,
      unit: i.unit,
      quantity: i.quantity,
    })),
  })
}
