import { Router } from 'express'
import * as maintenanceLogController from '../controllers/maintenanceLog.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { maintenanceLogSchema } from '../validations/maintenanceLog.validation'

// maintananceLog.php is embedded in manageLogistics.php — same no-auth-check gap, authenticate-only default.
export const maintenanceLogRouter = Router()

maintenanceLogRouter.use(authenticate)
maintenanceLogRouter.get('/', maintenanceLogController.list)
maintenanceLogRouter.get('/stats', maintenanceLogController.stats)
maintenanceLogRouter.post('/', validateBody(maintenanceLogSchema), maintenanceLogController.create)
