import { Router } from 'express'
import * as orderController from '../controllers/order.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { orderSchema, updateStatusSchema } from '../validations/order.validation'

// manageOrder.php/manageOrderP.php never call requireRole() — worse, manageOrder.php doesn't even
// require_once auth_guard.php (missing entirely, likely an oversight). Every sibling module so far
// has settled on "authenticate only, no role gate" for pages with no requireRole call; applying
// the same default here rather than leaving this one page's endpoints fully public.
export const orderRouter = Router()

const upload = createUploader('orders', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'ai', 'eps', 'svg'])
const uploadFields = upload.fields([
  { name: 'boqFile', maxCount: 1 },
  { name: 'artworkFile', maxCount: 1 },
])

orderRouter.use(authenticate)
orderRouter.get('/', orderController.list)
orderRouter.post('/', uploadFields, validateBody(orderSchema), orderController.create)
orderRouter.put('/:id', uploadFields, validateBody(orderSchema), orderController.update)
orderRouter.put('/:id/status', validateBody(updateStatusSchema), orderController.updateStatus)
