import { Router } from 'express'
import { Role } from '#prisma-client'
import * as takeoffProjectController from '../controllers/takeoffProject.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { takeoffProjectSchema } from '../validations/takeoffProject.validation'

// New feature (AI Takeoff / BOQ Generator, additive alongside the existing manual boq.routes.ts —
// see the implementation plan) — genuinely new work, so gated to the same audience as the existing
// BOQ nav link rather than left open like the legacy no-requireRole modules.
export const takeoffProjectRouter = Router()

// v0.2 — accepts a plain photo/render image too, not just a PDF (see the v0.2 plan §5). A raster
// upload skips Path A entirely (no text layer) and goes straight to Path B as a single image.
const upload = createUploader('takeoff-designs', ['pdf', 'jpg', 'jpeg', 'png'])

takeoffProjectRouter.use(authenticate)
takeoffProjectRouter.use(requireRole(Role.SuperAdmin, Role.StoresAdmin, Role.ProjectManager))
takeoffProjectRouter.get('/', takeoffProjectController.list)
takeoffProjectRouter.post('/', validateBody(takeoffProjectSchema), takeoffProjectController.create)
takeoffProjectRouter.get('/:id', takeoffProjectController.getOne)
takeoffProjectRouter.post('/:id/designs', upload.single('file'), takeoffProjectController.uploadDesign)
