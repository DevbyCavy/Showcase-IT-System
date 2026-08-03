// Translated from includes/vehicles/vehicleRegister.php, getVehicle.php, getVehicleDetails.php,
// deleteVehicle.php. The legacy only checked registration-number uniqueness at the application
// level, and only on add — edit could silently create a duplicate reg number since there was no DB
// constraint. registrationNumber is `@unique` in schema.prisma (Module 1's improvement), so the
// same friendly "already exists" message is produced for both add and edit here, closing that gap
// rather than leaking a raw constraint-violation error.

import type { Vehicle, User } from '#prisma-client'
import { ApiError } from '../middleware/errorHandler'
import * as vehicleRepository from '../repositories/vehicle.repository'
import type { VehicleBody } from '../validations/vehicle.validation'
import { toPublicUser } from '../utils/mapUser'

// Never return the raw Prisma User relation here — it carries passwordHash.
function toPublicVehicle(vehicle: Vehicle & { assignedUser: User | null }) {
  const { assignedUser, ...rest } = vehicle
  return { ...rest, assignedUser: assignedUser ? toPublicUser(assignedUser) : null }
}

export async function list() {
  const vehicles = await vehicleRepository.findAll()
  return vehicles.map(toPublicVehicle)
}

export async function getOne(id: number) {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found')
  }
  return toPublicVehicle(vehicle)
}

async function assertRegistrationNumberFree(registrationNumber: string, excludeId?: number) {
  const existing = await vehicleRepository.findByRegistrationNumber(registrationNumber)
  if (existing && existing.id !== excludeId) {
    throw new ApiError(409, 'Registration number already exists.')
  }
}

export async function create(input: VehicleBody) {
  await assertRegistrationNumberFree(input.registrationNumber)
  const vehicle = await vehicleRepository.create(input)
  return toPublicVehicle(vehicle)
}

export async function update(id: number, input: VehicleBody) {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found')
  }
  await assertRegistrationNumberFree(input.registrationNumber, id)
  const updated = await vehicleRepository.update(id, input)
  return toPublicVehicle(updated)
}

export async function remove(id: number) {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found')
  }
  await vehicleRepository.remove(id)
}
