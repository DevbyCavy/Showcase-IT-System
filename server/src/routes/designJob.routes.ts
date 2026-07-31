import { Router } from 'express'
import { Role } from '@prisma/client'
import * as designJobController from '../controllers/designJob.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { designJobSchema } from '../validations/designJob.validation'

// New feature: Marketer/Super Admin assign a design job (Artwork or 3D Design) to a Graphic
// Designer, with an optional sample reference file and a required deadline (see
// MIGRATION_PLAN.md §22). Whole router restricted to the three roles this is relevant to; creation
// further restricted to Marketer/Super Admin. Submitting completed work (PUT /:id/done) requires a
// completed design file and is ownership-guarded in the service (only the assigned designer), not
// role-gated here, same pattern as memo.service.ts.
export const designJobRouter = Router()

const upload = createUploader('design-jobs', ['png', 'jpg', 'jpeg', 'pdf'])

designJobRouter.use(authenticate)
designJobRouter.use(requireRole(Role.Marketer, Role.SuperAdmin, Role.GraphicDesigner))
designJobRouter.get('/', designJobController.list)
designJobRouter.post(
  '/',
  requireRole(Role.Marketer, Role.SuperAdmin),
  upload.single('sampleFile'),
  validateBody(designJobSchema),
  designJobController.create,
)
designJobRouter.put('/:id/done', upload.single('completedFile'), designJobController.markDone)
