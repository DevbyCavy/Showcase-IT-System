import { z } from 'zod'

// Translated from quickAddMemo.php's validation (title + due_date required).
export const quickAddMemoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().optional(),
  dueDate: z.coerce.date({ message: 'Due date is required.' }),
})

export type QuickAddMemoBody = z.infer<typeof quickAddMemoSchema>

// Translated from createOfficeTask.php's validation (title + due_date + assigned_to required).
export const createOfficeTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.'),
  description: z.string().trim().optional(),
  dueDate: z.coerce.date({ message: 'Due date is required.' }),
  assignedToId: z.coerce.number({ message: 'Please select who to assign this to.' }).int().positive(),
})

export type CreateOfficeTaskBody = z.infer<typeof createOfficeTaskSchema>
