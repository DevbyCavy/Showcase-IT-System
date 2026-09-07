import type { TakeoffItemCategory, TakeoffItemConfidence, TakeoffItemSource } from '#prisma-client'

// Shared by both extraction paths (takeoffPathA.ts / takeoffPathB.ts) and the reconciler
// (takeoffReconcile.ts) — a TakeoffItem row shape without designId, since these are candidates
// produced before the row is persisted.
export interface TakeoffExtractedItem {
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
