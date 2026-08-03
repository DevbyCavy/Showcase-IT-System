import { Router } from 'express'
import { Role } from '#prisma-client'
import * as requisitionController from '../controllers/requisition.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { requisitionSchema } from '../validations/requisition.validation'

export const requisitionRouter = Router()

requisitionRouter.use(authenticate)
// requisitions.php: no requireRole() — any logged-in user can submit/view.
requisitionRouter.get('/', requisitionController.list)
requisitionRouter.post('/', validateBody(requisitionSchema), requisitionController.create)
// processRequisition.php: hardcoded `$_SESSION['user_type'] !== 'Super Admin'` check.
requisitionRouter.put('/:id/process', requireRole(Role.SuperAdmin), requisitionController.process)
