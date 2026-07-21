import { Router } from 'express'
import * as workLogSheetController from '../controllers/workLogSheet.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { startTaskSchema } from '../validations/workLogSheet.validation'

export const workLogSheetRouter = Router()

// includes/workLogSheet.php: no requireRole() — any logged-in user gets their own widget.
workLogSheetRouter.use(authenticate)
workLogSheetRouter.get('/today', workLogSheetController.getToday)
workLogSheetRouter.get('/week', workLogSheetController.getWeekLog)
workLogSheetRouter.post('/shift/start', workLogSheetController.startShift)
workLogSheetRouter.post('/tasks', validateBody(startTaskSchema), workLogSheetController.startTask)
workLogSheetRouter.post('/tasks/:taskId/stop', workLogSheetController.stopTask)
workLogSheetRouter.post('/evening-shift', workLogSheetController.toggleEveningShift)
