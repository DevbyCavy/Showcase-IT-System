import { Router } from 'express'
import { Role } from '#prisma-client'
import * as quotationController from '../controllers/quotation.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { quotationSchema } from '../validations/quotation.validation'

// makeQuotation.php: legacy gated to requireRole('Marketer'). Marketer was dropped in Module 2's
// normalization (open to any authenticated user in the interim) and reintroduced in §21 — access
// is restricted back to Marketer + Super Admin (Super Admin as the catch-all admin override).
export const quotationRouter = Router()

const upload = createUploader('quotations', ['pdf', 'jpg', 'jpeg', 'png'])

quotationRouter.use(authenticate)
quotationRouter.use(requireRole(Role.Marketer, Role.SuperAdmin))
quotationRouter.get('/', quotationController.list)
quotationRouter.get('/:id', quotationController.getOne)
quotationRouter.get('/:id/pdf', quotationController.downloadPdf)
quotationRouter.post('/', upload.single('designFile'), validateBody(quotationSchema), quotationController.create)
// editQuotation.php/updateQuotation.php: requireRole('Super Admin').
quotationRouter.put('/:id', requireRole(Role.SuperAdmin), upload.single('designFile'), validateBody(quotationSchema), quotationController.update)
// processQuotation.php: hardcoded `$_SESSION['user_type'] !== 'Super Admin'` check.
quotationRouter.put('/:id/approve', requireRole(Role.SuperAdmin), quotationController.approve)
