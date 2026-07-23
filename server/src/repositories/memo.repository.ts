import { prisma } from '../config/prisma'

export interface MemoCreateData {
  title: string
  description?: string
  dueDate: Date
  createdById: number
}

export function create(data: MemoCreateData) {
  return prisma.memo.create({ data: { ...data, status: 'Pending' } })
}

// Mirrors getTaskCalendar.php's memo query: only the current user's own memos.
export function findForUserInRange(userId: number, start: Date, end: Date) {
  return prisma.memo.findMany({ where: { createdById: userId, dueDate: { gte: start, lte: end } } })
}
