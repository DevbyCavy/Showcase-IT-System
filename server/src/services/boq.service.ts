// Translated from createBOQ.php (order-linked, multi-row items, auto-numbered like orders) and
// downloadBOQ.php (DOMPDF -> Puppeteer, see utils/pdf.ts). Scoped from feature/boq-stock-requisitions
// per MIGRATION_PLAN.md §2.1 — main never had a working create path for this table.

import { ApiError } from '../middleware/errorHandler'
import * as boqRepository from '../repositories/boq.repository'
import * as orderRepository from '../repositories/order.repository'
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

export async function create(input: BoqBody, createdById: number) {
  const order = await orderRepository.findById(input.orderId)
  if (!order) {
    throw new ApiError(400, 'Selected order could not be found')
  }

  return boqRepository.create({
    orderId: input.orderId,
    orderNumber: order.orderNumber,
    eventName: input.eventName,
    clientName: input.clientName,
    location: input.location,
    createdById,
    items: input.items.map((i) => ({
      productName: i.productName,
      description: i.description,
      unit: i.unit,
      quantity: i.quantity,
    })),
  })
}
