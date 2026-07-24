// Translated from orders.php (kanban + lazy-cron auto status transitions), createOrder.php
// (order + order_assignments creation, BOQ/artwork upload), and update_order_status.php.
// Order editing is new — see MIGRATION_PLAN.md §"Order editing" decision.

import type { Order, OrderAssignment, OrderStatus, User } from '@prisma/client'
import { ApiError } from '../middleware/errorHandler'
import * as orderRepository from '../repositories/order.repository'
import * as whatsappService from './whatsapp.service'
import type { OrderBody } from '../validations/order.validation'

type OrderWithAssignments = Order & { assignments: (OrderAssignment & { user: User })[] }

function toPublicOrder(order: OrderWithAssignments) {
  const { assignments, ...rest } = order
  return {
    ...rest,
    assignedUsers: assignments.map((a) => ({ id: a.user.id, name: a.user.name, surname: a.user.surname })),
  }
}

export async function list() {
  await orderRepository.autoTransition()
  const orders = await orderRepository.findAll()
  return orders.map(toPublicOrder)
}

export interface UploadedOrderFiles {
  boqFile?: string
  artworkFile?: string
}

export async function create(input: OrderBody, files: UploadedOrderFiles) {
  const order = await orderRepository.create({ ...input, ...files })

  // Fire-and-forget: whatsapp.service.ts never throws, so notifying assignees can't block or fail order creation.
  for (const assignment of order.assignments) {
    void whatsappService.sendOrderAssignmentNotification(assignment.user, order)
  }

  return toPublicOrder(order)
}

export async function update(id: number, input: OrderBody, files: UploadedOrderFiles) {
  const existing = await orderRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Order not found')
  }
  const order = await orderRepository.update(id, { ...input, ...files })
  return toPublicOrder(order)
}

const ALLOWED_STATUSES: OrderStatus[] = ['New', 'Assigned', 'OnGoing', 'Completed']

export async function updateStatus(id: number, status: OrderStatus) {
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid parameters')
  }
  const existing = await orderRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Order not found')
  }
  const order = await orderRepository.updateStatus(id, status)
  return toPublicOrder(order)
}
