import { api } from './client'

export interface FuelLogStats {
  totalEntries: number
  totalLitres: number
  totalFuelCost: number
}

interface FuelLogStatsResponse {
  success: true
  data: FuelLogStats
}

export function stats() {
  return api.get<FuelLogStatsResponse>('/fuel-logs/stats').then((r) => r.data.data)
}

export interface FuelLogInput {
  vehicleId: number
  fuelDate: string
  odometerReading: number
  litres: number
  fuelCost: number
  fuelStation?: string
  receiptNumber?: string
  notes?: string
}

export function create(input: FuelLogInput) {
  return api.post('/fuel-logs', input)
}
