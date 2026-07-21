import { ApiError } from '../middleware/errorHandler'
import * as fuelLogRepository from '../repositories/fuelLog.repository'
import * as vehicleRepository from '../repositories/vehicle.repository'
import type { FuelLogBody } from '../validations/fuelLog.validation'

export function stats() {
  return fuelLogRepository.stats()
}

export async function create(input: FuelLogBody) {
  const vehicle = await vehicleRepository.findById(input.vehicleId)
  if (!vehicle) {
    throw new ApiError(400, 'Selected vehicle could not be found')
  }
  return fuelLogRepository.create(input)
}
