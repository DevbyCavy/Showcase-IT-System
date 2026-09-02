import { Router } from 'express'
import { Role } from '#prisma-client'
import * as takeoffDesignController from '../controllers/takeoffDesign.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { takeoffItemUpdateSchema } from '../validations/takeoffDesign.validation'

export const takeoffDesignRouter = Router()

takeoffDesignRouter.use(authenticate)
takeoffDesignRouter.use(requireRole(Role.SuperAdmin, Role.StoresAdmin, Role.ProjectManager))
// Polling target while a design's status is Pending/Processing — see TakeoffProjectDetail.tsx /
// TakeoffDesignReview.tsx client-side.
takeoffDesignRouter.get('/:id', takeoffDesignController.getOne)
takeoffDesignRouter.patch('/:id/items/:itemId', validateBody(takeoffItemUpdateSchema), takeoffDesignController.updateItem)
takeoffDesignRouter.get('/:id/export/xlsx', takeoffDesignController.exportXlsx)
takeoffDesignRouter.get('/:id/export/quotation.pdf', takeoffDesignController.exportQuotationPdf)
