import { z } from 'zod'

// Translated from fuelLog.php's add-entry form: vehicle/date/odometer/litres/cost are `required`;
// station/receipt/notes are not.
export const fuelLogSchema = z.object({
  vehicleId: z.coerce.number({ message: 'Please select a vehicle' }).int().positive('Please select a vehicle'),
  fuelDate: z.coerce.date({ message: 'Fuel Date is required' }),
  odometerReading: z.coerce.number({ message: 'Odometer Reading is required' }).min(0, 'Odometer Reading is required'),
  litres: z.coerce.number({ message: 'Litres is required' }).min(0, 'Litres is required'),
  fuelCost: z.coerce.number({ message: 'Fuel Cost is required' }).min(0, 'Fuel Cost is required'),
  fuelStation: z.string().trim().optional(),
  receiptNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export type FuelLogBody = z.infer<typeof fuelLogSchema>
