import { prisma } from '../config/prisma'
import type { OrderStatus } from '#prisma-client'

const include = {
  assignments: { include: { user: true } },
} as const

// Mirrors orders.php's "lazy cron": these two UPDATEs run on every read, not on a schedule.
// 1) New/Assigned -> OnGoing once the deadline passes. 2) OnGoing -> Completed 24h after that.
export async function autoTransition() {
  await prisma.order.updateMany({
    where: {
      status: { in: ['New', 'Assigned'] },
      deadlineDatetime: { not: null, lte: new Date() },
      ongoingSince: null,
    },
    data: { status: 'OnGoing', ongoingSince: new Date() },
  })

  await prisma.order.updateMany({
    where: {
      status: 'OnGoing',
      ongoingSince: { not: null, lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    data: { status: 'Completed' },
  })
}

export function findAll() {
  return prisma.order.findMany({ include, orderBy: { createdAt: 'desc' } })
}

export function findById(id: number) {
  return prisma.order.findUnique({ where: { id }, include })
}

// Mirrors createOrder.php: next order_number = MAX(order_number)+1, zero-padded to 3 digits.
export async function nextOrderNumber() {
  const last = await prisma.order.findFirst({ orderBy: { orderNumber: 'desc' } })
  const maxNo = last ? parseInt(last.orderNumber, 10) || 0 : 0
  return String(maxNo + 1).padStart(3, '0')
}

export interface OrderCreateData {
  orderName: string
  description?: string
  location: string
  deadlineDatetime: Date
  boqFile?: string
  artworkFile?: string
  assignedUserIds: number[]
}

export async function create(data: OrderCreateData) {
  const orderNumber = await nextOrderNumber()
  return prisma.order.create({
    data: {
      orderNumber,
      orderName: data.orderName,
      description: data.description,
      location: data.location,
      deadlineDatetime: data.deadlineDatetime,
      boqFile: data.boqFile,
      artworkFile: data.artworkFile,
      status: 'New',
      assignments: { create: data.assignedUserIds.map((userId) => ({ userId })) },
    },
    include,
  })
}

export interface OrderUpdateData {
  orderName: string
  description?: string
  location: string
  deadlineDatetime: Date
  boqFile?: string
  artworkFile?: string
  assignedUserIds: number[]
}

// Order editing is new (see MIGRATION_PLAN.md — the legacy "Edit Order" tab linked to a page that
// never existed). Reassignment replaces the full order_assignments set, matching how createOrder.php
// inserts one row per assigned user in the first place.
export function update(id: number, data: OrderUpdateData) {
  return prisma.$transaction(async (tx) => {
    await tx.orderAssignment.deleteMany({ where: { orderId: id } })
    return tx.order.update({
      where: { id },
      data: {
        orderName: data.orderName,
        description: data.description,
        location: data.location,
        deadlineDatetime: data.deadlineDatetime,
        ...(data.boqFile ? { boqFile: data.boqFile } : {}),
        ...(data.artworkFile ? { artworkFile: data.artworkFile } : {}),
        assignments: { create: data.assignedUserIds.map((userId) => ({ userId })) },
      },
      include,
    })
  })
}

// Mirrors update_order_status.php: a plain whitelist check against the enum, no transition-graph
// validation — any status can be set directly. Setting OnGoing also stamps ongoingSince (NOW()),
// which is what drives the 24h auto-complete window.
export function updateStatus(id: number, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: status === 'OnGoing' ? { status, ongoingSince: new Date() } : { status },
    include,
  })
}
