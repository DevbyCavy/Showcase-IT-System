import { Router } from 'express'
import * as vehicleTripController from '../controllers/vehicleTrip.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createTripSchema, endTripSchema } from '../validations/vehicleTrip.validation'

// tripLogbook.php is embedded in manageLogistics.php — same no-auth-check gap, authenticate-only default.
export const vehicleTripRouter = Router()

vehicleTripRouter.use(authenticate)
vehicleTripRouter.get('/stats', vehicleTripController.stats)
vehicleTripRouter.get('/available-vehicles', vehicleTripController.availableVehicles)
vehicleTripRouter.get('/active', vehicleTripController.active)
vehicleTripRouter.get('/history', vehicleTripController.history)
vehicleTripRouter.post('/', validateBody(createTripSchema), vehicleTripController.create)
vehicleTripRouter.put('/:id/end', validateBody(endTripSchema), vehicleTripController.end)
