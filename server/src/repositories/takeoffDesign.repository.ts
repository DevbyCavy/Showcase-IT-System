import { prisma } from '../config/prisma'
import type {
  TakeoffDesignStatus,
  TakeoffItemCategory,
  TakeoffItemConfidence,
  TakeoffItemSource,
  TakeoffPdfType,
  TakeoffClarificationTopic,
} from '#prisma-client'

const include = {
  items: { orderBy: { id: 'asc' as const } },
  clarifications: { orderBy: { id: 'asc' as const } },
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

// Used by runFinalization (see takeoffExtraction.service.ts) to replace the provisional item list
// with the final one — mirrors quotation.repository.ts#update's delete+reinsert pattern.
export function deleteItems(designId: number) {
  return prisma.takeoffItem.deleteMany({ where: { designId } })
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

export interface TakeoffClarificationCreateInput {
  topic: TakeoffClarificationTopic
  question: string
}

export function createClarifications(designId: number, questions: TakeoffClarificationCreateInput[]) {
  return prisma.takeoffClarification.createMany({ data: questions.map((q) => ({ ...q, designId })) })
}

export function findClarificationsByIds(ids: number[]) {
  return prisma.takeoffClarification.findMany({ where: { id: { in: ids } } })
}

export function answerClarification(id: number, answer: string, answeredById: number) {
  return prisma.takeoffClarification.update({
    where: { id },
    data: { answer, status: 'Answered', answeredById, answeredAt: new Date() },
  })
}

// This design's own answers, freshly given — folded into the finalization prompt as authoritative
// for this specific design (see takeoffExtraction.service.ts#runFinalization).
export function findAnsweredClarificationsForDesign(designId: number) {
  return prisma.takeoffClarification.findMany({ where: { designId, status: 'Answered' }, orderBy: { answeredAt: 'asc' } })
}

// Cross-design memory (see the v0.2 plan §4) — every prior Answered clarification across the
// whole app, not scoped to one project, so the same gap isn't asked about twice. excludeDesignId
// keeps a design's own answers (already injected separately as designAnswers) out of this list.
export function findGlobalAnsweredClarifications(excludeDesignId: number, limit: number) {
  return prisma.takeoffClarification.findMany({
    where: { status: 'Answered', designId: { not: excludeDesignId } },
    orderBy: { answeredAt: 'desc' },
    take: limit,
  })
}
