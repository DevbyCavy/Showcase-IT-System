import { prisma } from '../config/prisma'

// Mirrors IssueProductReport.php: `SELECT * FROM issued_tools ORDER BY date_of_collection DESC`.
export function findAll() {
  return prisma.issuedTool.findMany({ orderBy: { dateOfCollection: 'desc' } })
}

export interface IssueToolData {
  productId: number
  dateOfCollection: Date
  collectorName: string
  toolName: string
  quantityIssued: number
  jobName: string
  dateOfReturn: Date | null
}

export function create(data: IssueToolData) {
  return prisma.issuedTool.create({ data })
}
