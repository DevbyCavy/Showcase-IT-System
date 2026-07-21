import { Router } from 'express'
import * as vehicleDocumentController from '../controllers/vehicleDocument.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createUploader } from '../middleware/upload'
import { vehicleDocumentSchema } from '../validations/vehicleDocument.validation'

// vehicleDocuments.php is embedded in manageLogistics.php's sibling pages — same no-auth-check
// gap, authenticate-only default.
export const vehicleDocumentRouter = Router()

const upload = createUploader('vehicle_documents', ['pdf', 'jpg', 'jpeg', 'png'])

vehicleDocumentRouter.use(authenticate)
vehicleDocumentRouter.get('/', vehicleDocumentController.list)
vehicleDocumentRouter.get('/stats', vehicleDocumentController.stats)
vehicleDocumentRouter.post('/', upload.single('documentFile'), validateBody(vehicleDocumentSchema), vehicleDocumentController.create)
vehicleDocumentRouter.put('/:id', upload.single('documentFile'), validateBody(vehicleDocumentSchema), vehicleDocumentController.update)
