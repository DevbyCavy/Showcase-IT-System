import { z } from 'zod'
import { FuelType, VehicleStatus } from '@prisma/client'

// Translated from vehicleRegister.php's add/edit forms — only registration_number/make/model are
// actually `required` in the HTML; everything else is optional there. vehicleYear stays a real Int
// in this schema (an improvement — see MIGRATION_PLAN.md Module 1 notes on typed numeric columns),
// so an omitted year defaults to the current year rather than failing to parse.
export const vehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1, 'Registration Number is required'),
  make: z.string().trim().min(1, 'Make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  vehicleYear: z.coerce.number().int().optional().default(new Date().getFullYear()),
  color: z.string().trim().optional().default(''),
  fuelType: z.enum(FuelType).optional().default(FuelType.Petrol),
  capacity: z.string().trim().optional().default(''),
  department: z.string().trim().optional().default(''),
  assignedUserId: z.coerce.number().int().positive().nullable().optional().default(null),
  status: z.enum(VehicleStatus).optional().default(VehicleStatus.Available),
  // Empty string (an unfilled <input type="date">) must fall through to the default, not fail
  // z.coerce.date() outright — coercing "" produces an Invalid Date rather than an empty value.
  purchaseDate: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.date().optional().default(() => new Date()),
  ),
  notes: z.string().trim().optional(),
})

export type VehicleBody = z.infer<typeof vehicleSchema>
