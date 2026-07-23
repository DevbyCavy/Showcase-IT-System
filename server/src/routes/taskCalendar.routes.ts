import { Router } from 'express'
import * as taskCalendarController from '../controllers/taskCalendar.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createOfficeTaskSchema, quickAddMemoSchema } from '../validations/taskCalendar.validation'

// getTaskCalendar.php/quickAddMemo.php/createOfficeTask.php: no requireRole() — any logged-in
// user gets their own calendar and can assign a job to anyone.
export const taskCalendarRouter = Router()

taskCalendarRouter.use(authenticate)
taskCalendarRouter.get('/', taskCalendarController.getCalendar)
taskCalendarRouter.post('/memos', validateBody(quickAddMemoSchema), taskCalendarController.quickAddMemo)
taskCalendarRouter.post('/office-tasks', validateBody(createOfficeTaskSchema), taskCalendarController.createOfficeTask)
