import { z } from 'zod'

// Both fields required on create/edit — matches categories.js's client-side validation
// (Category Name and Status are both mandatory in both the add and edit modals).
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category Name field is required'),
  isActive: z.boolean({ message: 'Status field is required' }),
})

export type CategoryBody = z.infer<typeof categorySchema>
