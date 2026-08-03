import { z } from 'zod'
import { OrderStatus } from '#prisma-client'

// assignedUserIds arrives from multipart form data — a single selection is a bare string, multiple
// selections are an array of strings (multer's field parser), so normalize to an array first.
const assignedUserIds = z.preprocess(
  (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]),
  z.array(z.coerce.number().int().positive()).min(1, 'Please assign at least one person'),
)

// Translated from createOrder.php's validation block.
export const orderSchema = z.object({
  orderName: z.string().trim().min(1, 'Order Name is required'),
  description: z.string().trim().optional(),
  location: z.string().trim().min(1, 'Location is required'),
  deadlineDatetime: z.coerce.date({ message: 'Deadline is required' }),
  assignedUserIds,
})

export type OrderBody = z.infer<typeof orderSchema>

export const updateStatusSchema = z.object({
  status: z.enum(OrderStatus),
})
