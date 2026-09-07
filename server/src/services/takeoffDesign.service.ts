import { ApiError } from '../middleware/errorHandler'
import * as takeoffDesignRepository from '../repositories/takeoffDesign.repository'
import * as materialSpecRepository from '../repositories/materialSpec.repository'
import type { TakeoffItemUpdateBody, TakeoffAnswersBody } from '../validations/takeoffDesign.validation'

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
    clarifications: d.clarifications.map((c) => ({
      id: c.id,
      topic: c.topic,
      question: c.question,
      status: c.status,
      answer: c.answer,
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

// Human-in-the-loop answer step for a NeedsInput design (see the v0.2 plan §2/§3). Validates
// every answered clarification belongs to this design and is still Pending, saves the answers,
// and — the "let the model learn from user input" mechanism — auto-creates a MaterialSpec row for
// any Material-topic answer that names a material not already in the reference table, so the
// vocabulary genuinely grows from usage instead of needing manual /materials curation. Does NOT
// trigger the finalization pipeline itself — the controller does that via setImmediate, same
// fire-and-forget pattern as the initial upload.
export async function submitAnswers(designId: number, userId: number, input: TakeoffAnswersBody) {
  const design = await findOwnedDesign(designId, userId)
  if (design.status !== 'NeedsInput') {
    throw new ApiError(400, 'This design has no open clarifying questions to answer.')
  }

  const clarificationIds = input.answers.map((a) => a.clarificationId)
  const clarifications = await takeoffDesignRepository.findClarificationsByIds(clarificationIds)
  const byId = new Map(clarifications.map((c) => [c.id, c]))

  for (const { clarificationId } of input.answers) {
    const clarification = byId.get(clarificationId)
    if (!clarification || clarification.designId !== designId) {
      throw new ApiError(404, `Clarification ${clarificationId} not found on this design.`)
    }
    if (clarification.status !== 'Pending') {
      throw new ApiError(400, `Clarification ${clarificationId} has already been answered.`)
    }
  }

  const existingMaterialNames = new Set((await materialSpecRepository.findAll()).map((m) => m.name.toLowerCase()))

  for (const { clarificationId, answer } of input.answers) {
    await takeoffDesignRepository.answerClarification(clarificationId, answer, userId)

    const clarification = byId.get(clarificationId)!
    const trimmedAnswer = answer.trim()
    if (clarification.topic === 'Material' && trimmedAnswer && !existingMaterialNames.has(trimmedAnswer.toLowerCase())) {
      await materialSpecRepository.create({
        name: trimmedAnswer,
        unit: 'each',
        typicalThicknessMm: [],
        standardLengthsMm: [],
        wasteFactor: 1.1,
      })
      existingMaterialNames.add(trimmedAnswer.toLowerCase())
    }
  }
}

// Used by the export controllers — returns the full owned design (with items + project) rather
// than the JSON DTO, since exceljs/Puppeteer need the raw Decimal/Date values.
export async function getForExport(id: number, userId: number) {
  return findOwnedDesign(id, userId)
}
