import { z } from 'zod'

// Both fields required on create/edit — matches brand.js's client-side validation.
export const brandSchema = z.object({
  name: z.string().trim().min(1, 'Brand Name field is required'),
  isActive: z.boolean({ message: 'Status field is required' }),
})

export type BrandBody = z.infer<typeof brandSchema>
