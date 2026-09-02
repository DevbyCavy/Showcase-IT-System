import { z } from 'zod'

export const materialSpecSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  unit: z.string().trim().min(1, 'Unit is required.'),
  standardSheetWmm: z.coerce.number().positive().nullable().optional(),
  standardSheetHmm: z.coerce.number().positive().nullable().optional(),
  typicalThicknessMm: z.array(z.coerce.number().positive()).default([]),
  standardLengthsMm: z.array(z.coerce.number().positive()).default([]),
  wasteFactor: z.coerce.number().positive().default(1.1),
  // Nullable/unused in v0.1 — reserved for a future priced-BOQ phase (design doc §4/§8).
  unitCost: z.coerce.number().positive().nullable().optional(),
})

export type MaterialSpecBody = z.infer<typeof materialSpecSchema>
