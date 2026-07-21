import { Router } from 'express'
import * as vehicleController from '../controllers/vehicle.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { vehicleSchema } from '../validations/vehicle.validation'

// manageLogistics.php has no auth_guard at all (only session_start()) — same gap as
// manageOrder.php; applying the same authenticate-only default used across every module so far.
export const vehicleRouter = Router()

vehicleRouter.use(authenticate)
vehicleRouter.get('/', vehicleController.list)
vehicleRouter.get('/:id', vehicleController.getOne)
vehicleRouter.post('/', validateBody(vehicleSchema), vehicleController.create)
vehicleRouter.put('/:id', validateBody(vehicleSchema), vehicleController.update)
vehicleRouter.delete('/:id', vehicleController.remove)
