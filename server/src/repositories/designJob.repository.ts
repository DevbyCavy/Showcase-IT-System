import { prisma } from '../config/prisma'
import type { DesignJobType } from '@prisma/client'

const include = {
  assignedBy: true,
  assignedTo: true,
}

export function findAll() {
  return prisma.designJob.findMany({ include, orderBy: { createdAt: 'desc' } })
}

export function findById(id: number) {
  return prisma.designJob.findUnique({ where: { id }, include })
}

export interface DesignJobCreateData {
  title: string
  jobType: DesignJobType
  description?: string
  sampleFile?: string
  deadline: Date
  assignedById: number
  assignedToId: number
}

export function create(data: DesignJobCreateData) {
  return prisma.designJob.create({ data: { ...data, status: 'Pending' }, include })
}

// Ownership-guarded, atomic — mirrors quotation.repository.ts#markApproved's WHERE-guard pattern
// so a job can only be marked done (with completed work attached) by the designer it's actually
// assigned to.
export async function markDone(id: number, assignedToId: number, completedFile: string) {
  const result = await prisma.designJob.updateMany({
    where: { id, assignedToId },
    data: { status: 'Done', completedFile, completedAt: new Date() },
  })
  return result.count > 0
}
