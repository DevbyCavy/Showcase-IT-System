import { z } from 'zod'

// Translated from createBOQ.php's validation: order + event name + location required, at least
// one item with a real product selected (blank rows are silently skipped, not rejected — matches
// the legacy's "if (trim($name) === '') continue;", now keyed on productId instead of a free-text
// name since items are catalog-linked — see MIGRATION_PLAN.md §29).
const boqItemSchema = z.object({
  productId: z.coerce.number().int().min(0).default(0),
  description: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  quantity: z.coerce.number().min(0).default(0),
})

export const boqSchema = z
  .object({
    orderId: z.coerce.number().int().positive('Please select an order'),
    eventName: z.string().trim().min(1, 'Name of Event is required'),
    clientName: z.string().trim().optional(),
    location: z.string().trim().min(1, 'Location is required'),
    items: z.array(boqItemSchema),
  })
  .transform((data) => ({ ...data, items: data.items.filter((i) => i.productId > 0 && i.quantity > 0) }))
  .refine((data) => data.items.length > 0, { message: 'Please add at least one item with a product and quantity', path: ['items'] })

export type BoqBody = z.infer<typeof boqSchema>
