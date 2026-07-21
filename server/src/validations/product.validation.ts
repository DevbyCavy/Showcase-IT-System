import { z } from 'zod'

// multipart/form-data fields arrive as strings — coerce, matching product.js's required-field set
// (image itself is validated separately by the upload middleware, not this schema).
export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product Name field is required'),
  quantity: z.coerce.number().int('Quantity must be a whole number').min(0, 'Quantity field is required'),
  rate: z.coerce.number().min(0, 'Amount/Size field is required'),
  brandId: z.coerce.number().int().positive('Brand Name field is required'),
  categoryId: z.coerce.number().int().positive('Category Name field is required'),
  isActive: z
    .string()
    .refine((v) => v === '1' || v === '2', 'Status field is required')
    .transform((v) => v === '1'),
})

export type ProductBody = z.infer<typeof productSchema>

// The edit-info endpoint (editProduct.php's translation) has no file upload — plain JSON body
// with a real boolean, unlike the create endpoint's multipart "1"/"2" string convention.
export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Product Name field is required'),
  quantity: z.coerce.number().int('Quantity must be a whole number').min(0, 'Quantity field is required'),
  rate: z.coerce.number().min(0, 'Amount/Size field is required'),
  brandId: z.coerce.number().int().positive('Brand Name field is required'),
  categoryId: z.coerce.number().int().positive('Category Name field is required'),
  isActive: z.boolean({ message: 'Status field is required' }),
})

export type UpdateProductBody = z.infer<typeof updateProductSchema>

export const updateQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(0),
})
