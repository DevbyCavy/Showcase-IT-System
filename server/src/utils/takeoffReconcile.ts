// Reconciles Path A (text-layer extraction) and Path B (vision prediction) candidates into the
// final item list for a design — see design doc §3.2 "Reconciliation" and the implementation
// plan's §5 note that this is a pragmatic v0.1 heuristic, not exact duplicate detection.
//
// Rule: every Path A item is kept as-is (it's the higher-confidence, directly-extracted signal).
// A Path B item is dropped only if it closely duplicates a Path A item already covering the same
// physical thing — same category, same material (case-insensitive), and width/height each within
// ~5% of each other. Otherwise it's kept — this is also the only way predicted furniture/
// electrical items (which Path A structurally can't produce) make it into the final list.

import type { TakeoffExtractedItem } from '../types/takeoff.types'

const DIMENSION_TOLERANCE = 0.05

function withinTolerance(a: number, b: number): boolean {
  if (a === 0 && b === 0) return true
  const larger = Math.max(Math.abs(a), Math.abs(b))
  return Math.abs(a - b) / larger <= DIMENSION_TOLERANCE
}

function isDuplicate(pathBItem: TakeoffExtractedItem, pathAItem: TakeoffExtractedItem): boolean {
  if (pathBItem.category !== pathAItem.category) return false

  const materialA = pathAItem.material?.trim().toLowerCase() || null
  const materialB = pathBItem.material?.trim().toLowerCase() || null
  if (materialA !== materialB) return false

  if (pathAItem.widthMm != null && pathBItem.widthMm != null && !withinTolerance(pathAItem.widthMm, pathBItem.widthMm)) {
    return false
  }
  if (pathAItem.heightMm != null && pathBItem.heightMm != null && !withinTolerance(pathAItem.heightMm, pathBItem.heightMm)) {
    return false
  }

  return true
}

export function reconcile(pathAItems: TakeoffExtractedItem[], pathBItems: TakeoffExtractedItem[]): TakeoffExtractedItem[] {
  const keptPathBItems = pathBItems.filter((b) => !pathAItems.some((a) => isDuplicate(b, a)))
  return [...pathAItems, ...keptPathBItems]
}
