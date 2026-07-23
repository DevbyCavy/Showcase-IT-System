import { z } from 'zod'

// Translated from createMemo.php's validation (title + due_date required).
export const createMemoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().optional(),
  dueDate: z.coerce.date({ message: 'Due date is required.' }),
})

export type CreateMemoBody = z.infer<typeof createMemoSchema>

// Translated from acknowledgeMemo.php's `memo_ids` (comma-separated string there; a JSON array of
// ids here since this is a JSON API, not a form POST).
export const acknowledgeMemosSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'At least one memo id is required.'),
})

export type AcknowledgeMemosBody = z.infer<typeof acknowledgeMemosSchema>
