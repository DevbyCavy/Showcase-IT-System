import { Router } from 'express'
import { Role } from '@prisma/client'
import * as taskCalendarController from '../controllers/taskCalendar.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createOfficeTaskSchema, quickAddMemoSchema } from '../validations/taskCalendar.validation'

// getTaskCalendar.php: no requireRole() — any logged-in user gets their own calendar (own memos,
// tasks assigned to them, tasks they assigned), unchanged now that Marketer exists (see
// MIGRATION_PLAN.md §21) since office-task assignment is a general cross-role feature, not a
// Marketer-specific one. quickAddMemo.php/createOfficeTask.php: creating items is now restricted
// to Marketer + Super Admin — other roles can still see what's on their calendar, just can't add
// to it.
export const taskCalendarRouter = Router()

taskCalendarRouter.use(authenticate)
taskCalendarRouter.get('/', taskCalendarController.getCalendar)
taskCalendarRouter.post(
  '/memos',
  requireRole(Role.Marketer, Role.SuperAdmin),
  validateBody(quickAddMemoSchema),
  taskCalendarController.quickAddMemo,
)
taskCalendarRouter.post(
  '/office-tasks',
  requireRole(Role.Marketer, Role.SuperAdmin),
  validateBody(createOfficeTaskSchema),
  taskCalendarController.createOfficeTask,
)
