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

// Mirrors memos.php: `SELECT * FROM memos WHERE created_by = ? ORDER BY due_date ASC`.
export function findAllForUser(userId: number) {
  return prisma.memo.findMany({ where: { createdById: userId }, orderBy: { dueDate: 'asc' } })
}

// Mirrors updateMemoStatus.php's `WHERE memo_id = ? AND created_by = ?` ownership guard.
export async function markDone(id: number, userId: number) {
  const result = await prisma.memo.updateMany({ where: { id, createdById: userId }, data: { status: 'Done' } })
  return result.count > 0
}

// Mirrors deleteMemo.php's `WHERE memo_id = ? AND created_by = ?` ownership guard.
export async function remove(id: number, userId: number) {
  const result = await prisma.memo.deleteMany({ where: { id, createdById: userId } })
  return result.count > 0
}
