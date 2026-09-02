import { ApiError } from '../middleware/errorHandler'
import * as takeoffDesignRepository from '../repositories/takeoffDesign.repository'
import type { TakeoffItemUpdateBody } from '../validations/takeoffDesign.validation'

function toPublicDesign(d: NonNullable<Awaited<ReturnType<typeof takeoffDesignRepository.findById>>>) {
  return {
    id: d.id,
    projectId: d.projectId,
    originalFilename: d.originalFilename,
    pdfType: d.pdfType,
    status: d.status,
    failureReason: d.failureReason,
    uploadedAt: d.uploadedAt,
    project: { id: d.project.id, name: d.project.name, clientName: d.project.clientName },
    items: d.items.map((i) => ({
      id: i.id,
      description: i.description,
      category: i.category,
      material: i.material,
      widthMm: i.widthMm,
      heightMm: i.heightMm,
      lengthMm: i.lengthMm,
      unit: i.unit,
      quantity: i.quantity,
      source: i.source,
      confidence: i.confidence,
      notes: i.notes,
    })),
  }
}

async function findOwnedDesign(id: number, userId: number) {
  const design = await takeoffDesignRepository.findById(id)
  if (!design) {
    throw new ApiError(404, 'Design not found.')
  }
  if (design.project.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this design.')
  }
  return design
}

export async function getOne(id: number, userId: number) {
  return toPublicDesign(await findOwnedDesign(id, userId))
}

export async function updateItem(designId: number, itemId: number, input: TakeoffItemUpdateBody, userId: number) {
  await findOwnedDesign(designId, userId)

  const item = await takeoffDesignRepository.findItemById(itemId)
  if (!item || item.designId !== designId) {
    throw new ApiError(404, 'Item not found.')
  }

  const updated = await takeoffDesignRepository.updateItem(itemId, input)
  return {
    id: updated.id,
    description: updated.description,
    category: updated.category,
    material: updated.material,
    widthMm: updated.widthMm,
    heightMm: updated.heightMm,
    lengthMm: updated.lengthMm,
    unit: updated.unit,
    quantity: updated.quantity,
    source: updated.source,
    confidence: updated.confidence,
    notes: updated.notes,
  }
}

// Used by the export controllers — returns the full owned design (with items + project) rather
// than the JSON DTO, since exceljs/Puppeteer need the raw Decimal/Date values.
export async function getForExport(id: number, userId: number) {
  return findOwnedDesign(id, userId)
}
