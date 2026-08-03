// Translated from includes/vehicles/tripLogbook.php. Never return the raw Prisma `user` (driver)
// relation — see vehicle.service.ts's toPublicVehicle for why (it carries passwordHash).

import type { User, Vehicle, VehicleTrip } from '#prisma-client'
import { ApiError } from '../middleware/errorHandler'
import * as vehicleTripRepository from '../repositories/vehicleTrip.repository'
import * as vehicleRepository from '../repositories/vehicle.repository'
import { toPublicUser } from '../utils/mapUser'
import type { CreateTripBody, EndTripBody } from '../validations/vehicleTrip.validation'

function toPublicTrip(trip: VehicleTrip & { vehicle: Vehicle; user: User }) {
  const { user, ...rest } = trip
  return { ...rest, driver: toPublicUser(user) }
}

export function stats() {
  return vehicleTripRepository.stats()
}

export function availableVehicles() {
  return vehicleRepository.findAvailable()
}

export async function active() {
  const trips = await vehicleTripRepository.findActive()
  return trips.map(toPublicTrip)
}

export async function history() {
  const trips = await vehicleTripRepository.findHistory()
  return trips.map(toPublicTrip)
}

export async function create(input: CreateTripBody) {
  const result = await vehicleTripRepository.create(input)
  if (!result.trip) {
    throw new ApiError(400, result.error)
  }
  return toPublicTrip(result.trip)
}

export async function end(tripId: number, input: EndTripBody) {
  const result = await vehicleTripRepository.end(tripId, input)
  if (!result.trip) {
    throw new ApiError(404, result.error)
  }
  return toPublicTrip(result.trip)
}
