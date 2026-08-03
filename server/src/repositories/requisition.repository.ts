import { prisma } from '../config/prisma'
import type { RequisitionType } from '#prisma-client'

const include = {
  submittedBy: true,
  processedBy: true,
  product: true,
} as const

export function findAll() {
  return prisma.requisition.findMany({ include, orderBy: { createdAt: 'desc' } })
}

export function findById(id: number) {
  return prisma.requisition.findUnique({ where: { id }, include })
}

// Mirrors createRequisition.php: `MAX(CAST(SUBSTRING(req_number, 5) AS UNSIGNED))` -> "REQ-001", ...
export async function nextReqNumber() {
  const last = await prisma.requisition.findFirst({ orderBy: { reqNumber: 'desc' } })
  const maxNo = last ? parseInt(last.reqNumber.slice(4), 10) || 0 : 0
  return `REQ-${String(maxNo + 1).padStart(3, '0')}`
}

export interface RequisitionCreateData {
  projectManager: string
  eventName: string
  location: string
  eventDate: Date
  teamMembers?: string
  reqType: RequisitionType
  reqTypeOther?: string
  submittedById: number
}

export async function create(data: RequisitionCreateData) {
  const reqNumber = await nextReqNumber()
  return prisma.requisition.create({
    data: {
      reqNumber,
      projectManager: data.projectManager,
      eventName: data.eventName,
      location: data.location,
      eventDate: data.eventDate,
      teamMembers: data.teamMembers,
      reqType: data.reqType,
      reqTypeOther: data.reqTypeOther,
      submittedById: data.submittedById,
      status: 'Pending',
    },
    include,
  })
}

// Mirrors processRequisition.php's `WHERE status = 'Pending'` guard: atomic, so a requisition can
// never be processed twice even under concurrent clicks.
export async function markProcessed(id: number, processedById: number) {
  const result = await prisma.requisition.updateMany({
    where: { id, status: 'Pending' },
    data: { status: 'Processed', processedById, processedAt: new Date() },
  })
  return result.count > 0
}
