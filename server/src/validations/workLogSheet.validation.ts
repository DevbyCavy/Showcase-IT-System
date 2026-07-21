import { z } from 'zod'

// Translated from startTask.php's validation (task_name required, task_notes optional).
export const startTaskSchema = z.object({
  taskName: z.string().trim().min(1, 'Task name is required.'),
  taskNotes: z.string().trim().optional(),
})

export type StartTaskBody = z.infer<typeof startTaskSchema>

// Translated from stopTask.php's `task_id` param.
export const stopTaskSchema = z.object({
  taskId: z.coerce.number({ message: 'A task id is required.' }).int().positive(),
})

export type StopTaskBody = z.infer<typeof stopTaskSchema>
