import { prisma } from '../config/prisma'

const include = { assignedUser: true } as const

// Mirrors vehicleRegister.php: `ORDER BY vehicle_id DESC`.
export function findAll() {
  return prisma.vehicle.findMany({ include, orderBy: { id: 'desc' } })
}

export function findById(id: number) {
  return prisma.vehicle.findUnique({ where: { id }, include })
}

export function findByRegistrationNumber(registrationNumber: string) {
  return prisma.vehicle.findUnique({ where: { registrationNumber } })
}

// Mirrors tripLogbook.php's "New Trip" vehicle dropdown: `WHERE status = 'Available'`.
export function findAvailable() {
  return prisma.vehicle.findMany({ where: { status: 'Available' }, orderBy: { registrationNumber: 'asc' } })
}

export interface VehicleData {
  registrationNumber: string
  make: string
  model: string
  vehicleYear: number
  color: string
  fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'
  capacity: string
  department: string
  assignedUserId: number | null
  status: 'Available' | 'OnTrip' | 'UnderMaintenance' | 'OutOfService'
  purchaseDate: Date
  notes?: string
}

export function create(data: VehicleData) {
  return prisma.vehicle.create({ data, include })
}

export function update(id: number, data: VehicleData) {
  return prisma.vehicle.update({ where: { id }, data, include })
}

// Mirrors deleteVehicle.php: a real hard DELETE, not a soft-delete flag.
export function remove(id: number) {
  return prisma.vehicle.delete({ where: { id } })
}
