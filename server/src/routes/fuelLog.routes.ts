import { Router } from 'express'
import * as fuelLogController from '../controllers/fuelLog.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { fuelLogSchema } from '../validations/fuelLog.validation'

// fuelLog.php is embedded in manageLogistics.php — same no-auth-check gap, authenticate-only default.
export const fuelLogRouter = Router()

fuelLogRouter.use(authenticate)
fuelLogRouter.get('/stats', fuelLogController.stats)
fuelLogRouter.post('/', validateBody(fuelLogSchema), fuelLogController.create)
