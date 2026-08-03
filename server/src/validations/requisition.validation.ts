import { z } from 'zod'
import { RequisitionType } from '#prisma-client'

// Translated from createRequisition.php's validation, including the "Other" pattern: req_type is
// kept as the real category enum here (not overwritten with the free-text label the way
// createRequisition.php did) — see requisition.service.ts for how the display label is derived at
// read time instead, which preserves the same user-visible outcome without storing free text in
// an enum column.
export const requisitionSchema = z
  .object({
    projectManager: z.string().trim().min(1, 'Project Manager name is required.'),
    eventName: z.string().trim().min(1, 'Event name is required.'),
    location: z.string().trim().min(1, 'Location is required.'),
    eventDate: z.coerce.date({ message: 'Event date is required.' }),
    teamMembers: z.string().trim().optional(),
    reqType: z.enum(RequisitionType, { message: 'Please select a type of requisition.' }),
    reqTypeOther: z.string().trim().optional(),
  })
  .refine((data) => data.reqType !== 'Other' || !!data.reqTypeOther, {
    message: 'Please specify the type of requisition.',
    path: ['reqTypeOther'],
  })

export type RequisitionBody = z.infer<typeof requisitionSchema>
