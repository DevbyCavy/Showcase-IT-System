import { z } from 'zod'

// The human-in-the-loop review-table edit (see design doc §6) — every field optional since a
// single row edit only ever changes one or two fields at a time. category/source/confidence are
// intentionally not editable here: category could be added later if needed, but source/confidence
// describe how the row was produced, not what it is, so they stay system-set.
export const takeoffItemUpdateSchema = z.object({
  description: z.string().trim().min(1).optional(),
  category: z.enum(['Structure', 'Cladding', 'Electrical', 'Furniture', 'Other']).optional(),
  material: z.string().trim().nullable().optional(),
  widthMm: z.coerce.number().nullable().optional(),
  heightMm: z.coerce.number().nullable().optional(),
  lengthMm: z.coerce.number().nullable().optional(),
  unit: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().min(0).optional(),
  notes: z.string().trim().nullable().optional(),
})

export type TakeoffItemUpdateBody = z.infer<typeof takeoffItemUpdateSchema>

// POST /:id/answers — one answer per open TakeoffClarification (see takeoffDesign.service.ts#submitAnswers).
export const takeoffAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        clarificationId: z.coerce.number().int().positive(),
        answer: z.string().trim().min(1, 'Please provide an answer.'),
      }),
    )
    .min(1, 'Please answer at least one question.'),
})

export type TakeoffAnswersBody = z.infer<typeof takeoffAnswersSchema>
