import { z } from 'zod'
import { MaintenanceType } from '#prisma-client'

// Translated from maintananceLog.php's form: vehicle/type/service_date are `required`; everything
// else is optional there.
export const maintenanceLogSchema = z.object({
  vehicleId: z.coerce.number({ message: 'Please select a vehicle' }).int().positive('Please select a vehicle'),
  maintenanceType: z.enum(MaintenanceType, { message: 'Please select a maintenance type' }),
  serviceProvider: z.string().trim().optional(),
  serviceDate: z.coerce.date({ message: 'Service Date is required' }),
  odometerReading: z.coerce.number().min(0).optional(),
  serviceCost: z.coerce.number().min(0).optional(),
  nextServiceDate: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.date().optional()),
  nextServiceOdometer: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
})

export type MaintenanceLogBody = z.infer<typeof maintenanceLogSchema>
