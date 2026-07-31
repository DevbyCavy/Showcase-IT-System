import { Router } from 'express'
import { Role } from '@prisma/client'
import * as memoController from '../controllers/memo.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { acknowledgeMemosSchema, createMemoSchema } from '../validations/memo.validation'

// memos.php: legacy gated to the Marketer role. Open to any authenticated user in the interim
// after Module 2 dropped Marketer; restricted back to Marketer + Super Admin now that Marketer is
// reintroduced (see MIGRATION_PLAN.md §21), then opened to Graphic Designer too per Calvin's
// explicit request (§22) — memos are personal, own-records-only to-dos, not a Marketer-exclusive
// workflow like Quotations, so extending them to another role doesn't conflict with §21's intent.
// Own-records-only ownership guard (memo.service.ts) is unchanged.
export const memoRouter = Router()

memoRouter.use(authenticate)
memoRouter.use(requireRole(Role.Marketer, Role.SuperAdmin, Role.GraphicDesigner))
memoRouter.get('/', memoController.list)
memoRouter.get('/due-reminders', memoController.getDueReminders)
memoRouter.post('/', validateBody(createMemoSchema), memoController.create)
memoRouter.post('/acknowledge', validateBody(acknowledgeMemosSchema), memoController.acknowledge)
memoRouter.put('/:id/done', memoController.markDone)
memoRouter.delete('/:id', memoController.remove)
