import { z } from 'zod'

export const designJobSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required.'),
  jobType: z.enum(['Artwork', 'ThreeDDesign'], { message: 'Job type is required.' }),
  description: z.string().trim().optional(),
  deadline: z.coerce.date({ message: 'Deadline is required.' }),
  assignedToId: z.coerce.number({ message: 'Please choose a designer.' }).int().positive(),
})

export type DesignJobBody = z.infer<typeof designJobSchema>
