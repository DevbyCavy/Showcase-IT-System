// The AI Takeoff / BOQ Generator's pipeline orchestrator — invoked via setImmediate from
// takeoffProject.controller.ts#uploadDesign right after the initial `Pending` TakeoffDesign row is
// created and the HTTP response is sent, so the upload request itself never blocks on extraction.
// No background-job library exists anywhere in this codebase (confirmed by exploration) and none
// is warranted for a single fire-and-forget async step — this mirrors the codebase's existing
// "no framework beyond what's needed" style.

import { prisma } from '../config/prisma'
import * as takeoffDesignRepository from '../repositories/takeoffDesign.repository'
import { extractPathA } from '../utils/takeoffPathA'
import { extractPathB } from '../utils/takeoffPathB'
import { reconcile } from '../utils/takeoffReconcile'

export async function runExtraction(designId: number): Promise<void> {
  const design = await takeoffDesignRepository.findById(designId)
  if (!design) return

  await takeoffDesignRepository.updateStatus(designId, 'Processing')

  try {
    const materialNames = (await prisma.materialSpec.findMany({ select: { name: true } })).map((m) => m.name)

    const pathA = await extractPathA(design.storagePath, materialNames)
    const pathBItems = await extractPathB(design.storagePath)

    const pdfType = !pathA.textFound ? 'Rendered' : pathBItems.length > 0 ? 'Mixed' : 'Cad'
    const items = reconcile(pathA.items, pathBItems)

    if (items.length > 0) {
      await takeoffDesignRepository.createItems(designId, items)
    }
    await takeoffDesignRepository.updateStatus(designId, 'Ready', { pdfType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.'
    await takeoffDesignRepository.updateStatus(designId, 'Failed', { failureReason: message })
  }
}
