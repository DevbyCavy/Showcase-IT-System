import { Router } from 'express'
import * as trackingController from '../controllers/tracking.controller'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { locationPingSchema } from '../validations/tracking.validation'

// New feature: live GPS tracking of drivers during a trip via the browser's Geolocation API — see
// MIGRATION_PLAN.md §24. No requireRole(), matching the rest of the vehicle module
// (Vehicles/TripLogbook are open to any authenticated user) — the real security boundary is the
// ownership check in tracking.service.ts#recordPing: a user can only post location pings for a
// trip where they're the trip's own driver.
export const trackingRouter = Router()

trackingRouter.use(authenticate)
trackingRouter.post('/start', validateBody(locationPingSchema), trackingController.start)
trackingRouter.post('/update', validateBody(locationPingSchema), trackingController.update)
trackingRouter.post('/end', validateBody(locationPingSchema), trackingController.end)
trackingRouter.get('/live', trackingController.live)
trackingRouter.get('/history/:tripId', trackingController.history)
trackingRouter.get('/stats', trackingController.stats)
