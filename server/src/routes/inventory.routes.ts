import { Router } from 'express'
import { Role } from '#prisma-client'
import * as inventoryController from '../controllers/inventory.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { issueProductSchema, acknowledgeReturnsSchema } from '../validations/inventory.validation'

// store.php / IssueProductReport.php both require only a session, no requireRole() call.
export const inventoryRouter = Router()

inventoryRouter.use(authenticate)
inventoryRouter.get('/products', inventoryController.listAvailableProducts)
inventoryRouter.get('/issued-tools', inventoryController.listIssuedTools)
inventoryRouter.post('/issued-tools', validateBody(issueProductSchema), inventoryController.issueProduct)

// Return reminders (§33) — open to any authenticated user (getDueReminders only returns
// stores-wide items to Stores Admin/Super Admin internally; everyone else just gets their own
// collector-side reminders, same "no requireRole, own-records-only" precedent as Memos).
inventoryRouter.get('/due-reminders', inventoryController.getDueReminders)
inventoryRouter.post('/acknowledge/collector', validateBody(acknowledgeReturnsSchema), inventoryController.acknowledgeAsCollector)
inventoryRouter.post(
  '/acknowledge/stores',
  requireRole(Role.StoresAdmin, Role.SuperAdmin),
  validateBody(acknowledgeReturnsSchema),
  inventoryController.acknowledgeAsStores,
)
