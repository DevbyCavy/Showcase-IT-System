import { prisma } from '../config/prisma'

// Mirrors IssueProductReport.php: `SELECT * FROM issued_tools ORDER BY date_of_collection DESC`.
export function findAll() {
  return prisma.issuedTool.findMany({ orderBy: { dateOfCollection: 'desc' } })
}

export interface IssueToolData {
  productId: number
  dateOfCollection: Date
  collectorId: number
  collectorName: string
  toolName: string
  quantityIssued: number
  jobName: string
  isReturnable: boolean
  dateOfReturn: Date | null
}

export function create(data: IssueToolData) {
  return prisma.issuedTool.create({ data })
}

// Mirrors memo.repository.ts#findDueUnacknowledged's pattern, scoped to the collector instead of
// a creator — the person the item was issued to, not yet acknowledged, due or overdue.
export function findDueForCollector(userId: number) {
  return prisma.issuedTool.findMany({
    where: { collectorId: userId, isReturnable: true, collectorAckAt: null, dateOfReturn: { lte: new Date() } },
    orderBy: { dateOfReturn: 'asc' },
  })
}

// Team-wide (not scoped to a specific admin) — any Stores Admin dismissing one hides it for all
// of them, matching a shared-inbox model rather than per-admin tracking.
export function findDueForStores() {
  return prisma.issuedTool.findMany({
    where: { isReturnable: true, storesAckAt: null, dateOfReturn: { lte: new Date() } },
    orderBy: { dateOfReturn: 'asc' },
  })
}

export async function acknowledgeForCollector(ids: number[], userId: number) {
  const result = await prisma.issuedTool.updateMany({
    where: { id: { in: ids }, collectorId: userId },
    data: { collectorAckAt: new Date() },
  })
  return result.count
}

export async function acknowledgeForStores(ids: number[]) {
  const result = await prisma.issuedTool.updateMany({
    where: { id: { in: ids } },
    data: { storesAckAt: new Date() },
  })
  return result.count
}
