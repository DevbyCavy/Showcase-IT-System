import { Router } from 'express'
import { Role } from '#prisma-client'
import * as invoiceController from '../controllers/proformaInvoice.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { recordPaymentSchema } from '../validations/proformaInvoice.validation'

// Proforma invoices & payments (MIGRATION_PLAN.md §34). "Finance" in the feature brief maps to the
// existing Accountant role — there is no separate Finance role — plus Super Admin as the usual
// catch-all admin override. Every route is gated server-side, not just hidden in the nav.
export const financeRouter = Router()

financeRouter.use(authenticate)
financeRouter.use(requireRole(Role.Accountant, Role.SuperAdmin))
financeRouter.get('/proforma-invoices', invoiceController.list)
financeRouter.get('/proforma-invoices/:id', invoiceController.getOne)
financeRouter.get('/proforma-invoices/:id/pdf', invoiceController.downloadPdf)
financeRouter.get('/proforma-invoices/:id/view', invoiceController.viewHtml)
financeRouter.post('/proforma-invoices/:id/payments', validateBody(recordPaymentSchema), invoiceController.recordPayment)
financeRouter.get('/payments/:id/receipt', invoiceController.downloadReceipt)
financeRouter.get('/payments/:id/receipt/view', invoiceController.viewReceiptHtml)
