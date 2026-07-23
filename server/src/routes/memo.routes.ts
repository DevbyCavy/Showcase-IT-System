import { Router } from 'express'
import * as memoController from '../controllers/memo.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { acknowledgeMemosSchema, createMemoSchema } from '../validations/memo.validation'

// memos.php: no requireRole() any more (see memo.service.ts) — any logged-in user, own records only.
export const memoRouter = Router()

memoRouter.use(authenticate)
memoRouter.get('/', memoController.list)
memoRouter.get('/due-reminders', memoController.getDueReminders)
memoRouter.post('/', validateBody(createMemoSchema), memoController.create)
memoRouter.post('/acknowledge', validateBody(acknowledgeMemosSchema), memoController.acknowledge)
memoRouter.put('/:id/done', memoController.markDone)
memoRouter.delete('/:id', memoController.remove)
