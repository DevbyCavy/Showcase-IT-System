import { prisma } from '../config/prisma'

export interface OfficeTaskCreateData {
  title: string
  description?: string
  dueDate: Date
  assignedById: number
  assignedToId: number
}

export function create(data: OfficeTaskCreateData) {
  return prisma.officeTask.create({ data: { ...data, status: 'Pending' } })
}

// Mirrors getTaskCalendar.php's "assigned to me" query.
export function findAssignedToInRange(userId: number, start: Date, end: Date) {
  return prisma.officeTask.findMany({
    where: { assignedToId: userId, dueDate: { gte: start, lte: end } },
    include: { assignedBy: true },
  })
}

// Mirrors getTaskCalendar.php's "assigned by me" query.
export function findAssignedByInRange(userId: number, start: Date, end: Date) {
  return prisma.officeTask.findMany({
    where: { assignedById: userId, dueDate: { gte: start, lte: end } },
    include: { assignedTo: true },
  })
}
