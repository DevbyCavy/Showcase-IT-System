import { z } from 'zod'

// Mirrors issuedProduct.js's required-field set (date_of_return is the one optional field).
export const issueProductSchema = z.object({
  productId: z.coerce.number().int().positive(),
  dateOfCollection: z.coerce.date({ message: 'Date of Collection is required' }),
  collectorName: z.string().trim().min(1, 'Name of Collector is required'),
  toolName: z.string().trim().min(1, 'Product is required'),
  quantityIssued: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  jobName: z.string().trim().min(1, 'Job Name is required'),
  dateOfReturn: z.coerce.date().nullable().optional(),
})

export type IssueProductBody = z.infer<typeof issueProductSchema>
