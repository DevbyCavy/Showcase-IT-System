import { Router } from 'express'
import * as inventoryController from '../controllers/inventory.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { issueProductSchema } from '../validations/inventory.validation'

// store.php / IssueProductReport.php both require only a session, no requireRole() call.
export const inventoryRouter = Router()

inventoryRouter.use(authenticate)
inventoryRouter.get('/products', inventoryController.listAvailableProducts)
inventoryRouter.get('/issued-tools', inventoryController.listIssuedTools)
inventoryRouter.post('/issued-tools', validateBody(issueProductSchema), inventoryController.issueProduct)
