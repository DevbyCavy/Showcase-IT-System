import { Router } from 'express'
import { Role } from '#prisma-client'
import * as materialSpecController from '../controllers/materialSpec.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { materialSpecSchema } from '../validations/materialSpec.validation'

// Reference table backing the AI Takeoff / BOQ Generator's Path A material matching — same
// audience as the rest of that feature (see takeoffProject.routes.ts).
export const materialSpecRouter = Router()

materialSpecRouter.use(authenticate)
materialSpecRouter.use(requireRole(Role.SuperAdmin, Role.StoresAdmin, Role.ProjectManager))
materialSpecRouter.get('/', materialSpecController.list)
materialSpecRouter.post('/', validateBody(materialSpecSchema), materialSpecController.create)
materialSpecRouter.put('/:id', validateBody(materialSpecSchema), materialSpecController.update)
materialSpecRouter.delete('/:id', materialSpecController.remove)
