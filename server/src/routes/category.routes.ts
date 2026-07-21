import { Router } from 'express'
import * as categoryController from '../controllers/category.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { categorySchema } from '../validations/category.validation'

// categories.php requires a session but calls no requireRole() — any logged-in user, any role.
// Matches that: `authenticate` only, no `requireRole` gate.
export const categoryRouter = Router()

categoryRouter.use(authenticate)
categoryRouter.get('/', categoryController.list)
categoryRouter.get('/:id', categoryController.getOne)
categoryRouter.post('/', validateBody(categorySchema), categoryController.create)
categoryRouter.put('/:id', validateBody(categorySchema), categoryController.update)
categoryRouter.delete('/:id', categoryController.remove)
