import { z } from 'zod'

// Translated from tripLogbook.php's forms.
export const createTripSchema = z.object({
  vehicleId: z.coerce.number({ message: 'Please select a vehicle' }).int().positive('Please select a vehicle'),
  userId: z.coerce.number({ message: 'Please select a driver' }).int().positive('Please select a driver'),
  destination: z.string().trim().min(1, 'Destination is required'),
  purpose: z.string().trim().optional(),
  departureDatetime: z.coerce.date({ message: 'Departure Date & Time is required' }),
  odometerStart: z.coerce.number({ message: 'Odometer Start is required' }).min(0),
})

export type CreateTripBody = z.infer<typeof createTripSchema>

export const endTripSchema = z.object({
  returnDatetime: z.coerce.date({ message: 'Return Date & Time is required' }),
  odometerEnd: z.coerce.number({ message: 'Odometer End is required' }).min(0),
  remarks: z.string().trim().optional(),
})

export type EndTripBody = z.infer<typeof endTripSchema>
