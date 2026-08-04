import { z } from 'zod'

// Translated from createQuotation.php/updateQuotation.php's validation, including the "blank rows
// are silently skipped, not rejected" pattern (`if (trim($desc) === '') continue;`). Items arrive
// as a JSON-encoded string field (multipart form data alongside the design_file upload), so a raw
// string is parsed before array validation.
const quotationItemSchema = z.object({
  description: z.string().trim(),
  quantity: z.coerce.number({ message: 'Quantity is required.' }).min(0).default(0),
  unitPrice: z.coerce.number({ message: 'Unit price is required.' }).min(0).default(0),
})

const itemsField = z.preprocess((v) => {
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return v
    }
  }
  return v
}, z.array(quotationItemSchema, { message: 'Please add at least one line item.' }))

export const quotationSchema = z
  .object({
    customerName: z.string().trim().min(1, 'Customer name is required.'),
    customerId: z.string().trim().optional(),
    projectName: z.string().trim().optional(),
    orderNumber: z.string().trim().optional(),
    quoteDate: z.coerce.date({ message: 'Quote date is required.' }),
    termsConditions: z.string().trim().optional(),
    // Arrives as the literal string "true"/"false" from FormData (see client/src/api/quotations.ts)
    // — z.coerce.boolean() would treat "false" as truthy (JS's Boolean("false") === true), so this
    // only accepts the exact string "true"; anything else (including missing) is false.
    applyVat: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
    items: itemsField,
  })
  .transform((data) => ({ ...data, items: data.items.filter((i) => i.description !== '') }))
  .refine((data) => data.items.length > 0, { message: 'Please add at least one line item.', path: ['items'] })

export type QuotationBody = z.infer<typeof quotationSchema>
