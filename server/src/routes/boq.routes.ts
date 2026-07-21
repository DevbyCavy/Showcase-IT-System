import { Router } from 'express'
import * as boqController from '../controllers/boq.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { boqSchema } from '../validations/boq.validation'

// createBOQ.php is embedded in manageOrder.php/manageOrderP.php — same "authenticate only, no
// requireRole" pattern as Orders.
export const boqRouter = Router()

boqRouter.use(authenticate)
boqRouter.get('/', boqController.list)
boqRouter.get('/:id', boqController.getOne)
boqRouter.get('/:id/pdf', boqController.downloadPdf)
boqRouter.post('/', validateBody(boqSchema), boqController.create)
