import { Router } from 'express'
import { Role } from '@prisma/client'
import * as quotationController from '../controllers/quotation.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { quotationSchema } from '../validations/quotation.validation'

// makeQuotation.php: legacy gated to requireRole('Marketer'), a role dropped in Module 2's
// normalization — submission is open to any authenticated user instead (see MIGRATION_PLAN.md §10).
export const quotationRouter = Router()

const upload = createUploader('quotations', ['pdf', 'jpg', 'jpeg', 'png'])

quotationRouter.use(authenticate)
quotationRouter.get('/', quotationController.list)
quotationRouter.get('/:id', quotationController.getOne)
quotationRouter.get('/:id/pdf', quotationController.downloadPdf)
quotationRouter.post('/', upload.single('designFile'), validateBody(quotationSchema), quotationController.create)
// editQuotation.php/updateQuotation.php: requireRole('Super Admin').
quotationRouter.put('/:id', requireRole(Role.SuperAdmin), upload.single('designFile'), validateBody(quotationSchema), quotationController.update)
// processQuotation.php: hardcoded `$_SESSION['user_type'] !== 'Super Admin'` check.
quotationRouter.put('/:id/approve', requireRole(Role.SuperAdmin), quotationController.approve)
