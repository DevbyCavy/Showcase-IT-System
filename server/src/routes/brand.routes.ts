import { Router } from 'express'
import * as brandController from '../controllers/brand.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { brandSchema } from '../validations/brand.validation'

// brand.php requires a session but calls no requireRole() — any logged-in user, any role.
export const brandRouter = Router()

brandRouter.use(authenticate)
brandRouter.get('/', brandController.list)
brandRouter.get('/:id', brandController.getOne)
brandRouter.post('/', validateBody(brandSchema), brandController.create)
brandRouter.put('/:id', validateBody(brandSchema), brandController.update)
brandRouter.delete('/:id', brandController.remove)
