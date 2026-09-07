import { z } from 'zod'

export const takeoffProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  clientName: z.string().trim().optional(),
})

export type TakeoffProjectBody = z.infer<typeof takeoffProjectSchema>
