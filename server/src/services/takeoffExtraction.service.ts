// The AI Takeoff / BOQ Generator's pipeline orchestrator. Two entry points, both invoked via
// setImmediate — runExtraction right after upload (takeoffProject.controller.ts), runFinalization
// right after the user answers open clarifying questions (takeoffDesign.controller.ts) — so
// neither request blocks on the pipeline. No background-job library exists anywhere in this
// codebase and none is warranted for a fire-and-forget async step; this mirrors the codebase's
// existing "no framework beyond what's needed" style.

import path from 'node:path'
import fs from 'node:fs/promises'
import { prisma } from '../config/prisma'
import * as takeoffDesignRepository from '../repositories/takeoffDesign.repository'
import { extractPathA } from '../utils/takeoffPathA'
import { extractPathB, type TakeoffKnownFact, type TakeoffPageImage, type TakeoffExtractionResult } from '../utils/takeoffPathB'
import { rasterizePdf } from '../utils/takeoffRasterize'
import { reconcile } from '../utils/takeoffReconcile'
import type { TakeoffExtractedItem } from '../types/takeoff.types'
import type { TakeoffPdfType } from '#prisma-client'

// Cross-design memory (see the v0.2 plan §4) — bounds how many prior Answered clarifications get
// dumped into the prompt. Prompt-injection-based, not retrieval — fine at "dozens to low-hundreds
// of facts" scale; a much larger corpus would need actual retrieval instead of a flat recent list.
const KNOWN_FACTS_LIMIT = 100

function isPdf(storagePath: string): boolean {
  return path.extname(storagePath).toLowerCase() === '.pdf'
}

async function loadImages(storagePath: string): Promise<TakeoffPageImage[]> {
  if (isPdf(storagePath)) {
    return rasterizePdf(storagePath)
  }
  const mediaType = path.extname(storagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'
  const data = await fs.readFile(storagePath)
  return [{ data, mediaType }]
}

async function loadKnownFacts(excludeDesignId: number): Promise<TakeoffKnownFact[]> {
  const rows = await takeoffDesignRepository.findGlobalAnsweredClarifications(excludeDesignId, KNOWN_FACTS_LIMIT)
  return rows.filter((r): r is typeof r & { answer: string } => r.answer != null).map((r) => ({ question: r.question, answer: r.answer }))
}

interface PipelineResult {
  pathAItems: TakeoffExtractedItem[]
  pathBResult: TakeoffExtractionResult
  pdfType: TakeoffPdfType
}

async function runPipeline(
  designId: number,
  storagePath: string,
  options: { isFinalizationPass?: boolean; designAnswers?: TakeoffKnownFact[] },
): Promise<PipelineResult> {
  const materialNames = (await prisma.materialSpec.findMany({ select: { name: true } })).map((m) => m.name)
  const knownFacts = await loadKnownFacts(designId)
  const images = await loadImages(storagePath)

  const pathA = isPdf(storagePath) ? await extractPathA(storagePath, materialNames) : { items: [], textFound: false }
  const pathBResult = await extractPathB(images, { materialNames, knownFacts, ...options })

  const pdfType: TakeoffPdfType = !pathA.textFound ? 'Rendered' : pathBResult.items.length > 0 ? 'Mixed' : 'Cad'
  return { pathAItems: pathA.items, pathBResult, pdfType }
}

export async function runExtraction(designId: number): Promise<void> {
  const design = await takeoffDesignRepository.findById(designId)
  if (!design) return

  await takeoffDesignRepository.updateStatus(designId, 'Processing')

  try {
    const { pathAItems, pathBResult, pdfType } = await runPipeline(designId, design.storagePath, {})
    const items = reconcile(pathAItems, pathBResult.items)

    if (items.length > 0) {
      await takeoffDesignRepository.createItems(designId, items)
    }

    if (pathBResult.questions.length > 0) {
      await takeoffDesignRepository.createClarifications(designId, pathBResult.questions)
      await takeoffDesignRepository.updateStatus(designId, 'NeedsInput', { pdfType })
    } else {
      await takeoffDesignRepository.updateStatus(designId, 'Ready', { pdfType })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.'
    await takeoffDesignRepository.updateStatus(designId, 'Failed', { failureReason: message })
  }
}

// Triggered by POST /takeoff-designs/:id/answers once the user has answered every open
// clarification for this design. Re-runs the pipeline with those answers folded in as
// authoritative context and an explicit "final pass, don't ask again" instruction (see
// takeoffPathB.ts) — caps clarification at exactly one round. Replaces the provisional item list
// wholesale rather than merging, mirroring quotation.repository.ts#update's delete+reinsert.
export async function runFinalization(designId: number): Promise<void> {
  const design = await takeoffDesignRepository.findById(designId)
  if (!design) return

  await takeoffDesignRepository.updateStatus(designId, 'Processing')

  try {
    const designAnswers = (await takeoffDesignRepository.findAnsweredClarificationsForDesign(designId))
      .filter((c): c is typeof c & { answer: string } => c.answer != null)
      .map((c) => ({ question: c.question, answer: c.answer }))

    const { pathAItems, pathBResult, pdfType } = await runPipeline(designId, design.storagePath, {
      isFinalizationPass: true,
      designAnswers,
    })
    const items = reconcile(pathAItems, pathBResult.items)

    await takeoffDesignRepository.deleteItems(designId)
    if (items.length > 0) {
      await takeoffDesignRepository.createItems(designId, items)
    }
    await takeoffDesignRepository.updateStatus(designId, 'Ready', { pdfType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Finalization failed.'
    await takeoffDesignRepository.updateStatus(designId, 'Failed', { failureReason: message })
  }
}
