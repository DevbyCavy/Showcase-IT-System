import { ApiError } from '../middleware/errorHandler'
import * as maintenanceLogRepository from '../repositories/maintenanceLog.repository'
import * as vehicleRepository from '../repositories/vehicle.repository'
import type { MaintenanceLogBody } from '../validations/maintenanceLog.validation'

export function list() {
  return maintenanceLogRepository.findAll()
}

export function stats() {
  return maintenanceLogRepository.stats()
}

export async function create(input: MaintenanceLogBody) {
  const vehicle = await vehicleRepository.findById(input.vehicleId)
  if (!vehicle) {
    throw new ApiError(400, 'Selected vehicle could not be found')
  }
  return maintenanceLogRepository.create(input)
}
