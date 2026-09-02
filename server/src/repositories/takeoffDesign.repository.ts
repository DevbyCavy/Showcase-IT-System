import { prisma } from '../config/prisma'
import type { TakeoffDesignStatus, TakeoffItemCategory, TakeoffItemConfidence, TakeoffItemSource, TakeoffPdfType } from '#prisma-client'

const include = {
  items: { orderBy: { id: 'asc' as const } },
  project: { select: { id: true, userId: true, name: true, clientName: true } },
}

export function findById(id: number) {
  return prisma.takeoffDesign.findUnique({ where: { id }, include })
}

export interface TakeoffDesignStatusUpdate {
  pdfType?: TakeoffPdfType
  failureReason?: string | null
}

export function updateStatus(id: number, status: TakeoffDesignStatus, extra: TakeoffDesignStatusUpdate = {}) {
  return prisma.takeoffDesign.update({ where: { id }, data: { status, ...extra } })
}

export interface TakeoffItemCreateInput {
  description: string
  category: TakeoffItemCategory
  material?: string | null
  widthMm?: number | null
  heightMm?: number | null
  lengthMm?: number | null
  unit: string
  quantity: number
  source: TakeoffItemSource
  confidence: TakeoffItemConfidence
  notes?: string | null
}

export function createItems(designId: number, items: TakeoffItemCreateInput[]) {
  return prisma.takeoffItem.createMany({ data: items.map((i) => ({ ...i, designId })) })
}

export function findItemById(id: number) {
  return prisma.takeoffItem.findUnique({ where: { id }, include: { design: { select: { id: true, project: { select: { userId: true } } } } } })
}

export interface TakeoffItemUpdateInput {
  description?: string
  category?: TakeoffItemCategory
  material?: string | null
  widthMm?: number | null
  heightMm?: number | null
  lengthMm?: number | null
  unit?: string
  quantity?: number
  notes?: string | null
}

export function updateItem(id: number, data: TakeoffItemUpdateInput) {
  return prisma.takeoffItem.update({ where: { id }, data })
}
