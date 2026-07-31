import { z } from 'zod'

// Shared by /start, /update, /end — all three are the same shape (one GPS ping); the endpoint
// hit conveys the semantics (first ping, ongoing ping, final ping), not the payload.
export const locationPingSchema = z.object({
  tripId: z.coerce.number({ message: 'Trip id is required.' }).int().positive(),
  latitude: z.coerce.number({ message: 'Latitude is required.' }).min(-90).max(90),
  longitude: z.coerce.number({ message: 'Longitude is required.' }).min(-180).max(180),
  accuracy: z.coerce.number().nonnegative().optional(),
  speed: z.coerce.number().nonnegative().optional(),
  heading: z.coerce.number().min(0).max(360).optional(),
})

export type LocationPingBody = z.infer<typeof locationPingSchema>
