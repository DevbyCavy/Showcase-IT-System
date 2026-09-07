import { prisma } from '../config/prisma'

const designSummarySelect = {
  id: true,
  originalFilename: true,
  status: true,
  pdfType: true,
  uploadedAt: true,
}

export function findAllByUser(userId: number) {
  return prisma.takeoffProject.findMany({
    where: { userId },
    include: { _count: { select: { designs: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export function findByIdWithDesigns(id: number) {
  return prisma.takeoffProject.findUnique({
    where: { id },
    include: { designs: { select: designSummarySelect, orderBy: { uploadedAt: 'desc' } } },
  })
}

export interface TakeoffProjectCreateData {
  userId: number
  name: string
  clientName?: string
}

export function create(data: TakeoffProjectCreateData) {
  return prisma.takeoffProject.create({ data })
}

export interface TakeoffDesignCreateData {
  projectId: number
  originalFilename: string
  storagePath: string
}

export function createDesign(data: TakeoffDesignCreateData) {
  return prisma.takeoffDesign.create({ data })
}
