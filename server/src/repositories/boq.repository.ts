import { prisma } from '../config/prisma'

const include = { items: true } as const

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

export interface BoqCreateData {
  orderId: number
  orderNumber: string
  eventName: string
  clientName?: string
  location: string
  createdById: number
  items: { productName: string; description?: string; unit?: string; quantity: number }[]
}

export async function create(data: BoqCreateData) {
  const boqNumber = await nextBoqNumber()
  return prisma.boq.create({
    data: {
      boqNumber,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      eventName: data.eventName,
      clientName: data.clientName,
      location: data.location,
      createdById: data.createdById,
      items: { create: data.items },
    },
    include,
  })
}
