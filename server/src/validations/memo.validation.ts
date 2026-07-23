import { z } from 'zod'

// Translated from createMemo.php's validation (title + due_date required).
export const createMemoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().optional(),
  dueDate: z.coerce.date({ message: 'Due date is required.' }),
})

export type CreateMemoBody = z.infer<typeof createMemoSchema>
