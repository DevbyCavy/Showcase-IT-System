import { z } from 'zod'

// Mirrors issuedProduct.js's required-field set, plus §33: collectorId (a real system user, so a
// return reminder can actually reach them) replaces free-text collectorName, and dateOfReturn is
// required whenever isReturnable is true (it's now the reminder's due date, not just a display
// field).
export const issueProductSchema = z
  .object({
    productId: z.coerce.number().int().positive(),
    dateOfCollection: z.coerce.date({ message: 'Date of Collection is required' }),
    collectorId: z.coerce.number().int().positive({ message: 'Please select who is collecting this.' }),
    toolName: z.string().trim().min(1, 'Product is required'),
    quantityIssued: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    jobName: z.string().trim().min(1, 'Job Name is required'),
    isReturnable: z.coerce.boolean().default(false),
    dateOfReturn: z.coerce.date().nullable().optional(),
  })
  .refine((data) => !data.isReturnable || data.dateOfReturn, {
    message: 'Please set a return date for a returnable item.',
    path: ['dateOfReturn'],
  })

export type IssueProductBody = z.infer<typeof issueProductSchema>

export const acknowledgeReturnsSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
})

export type AcknowledgeReturnsBody = z.infer<typeof acknowledgeReturnsSchema>
