import { api } from './client'
import type { Vehicle } from './vehicles'

export type MaintenanceType =
  | 'Service'
  | 'OilChange'
  | 'TyreReplacement'
  | 'BrakeRepair'
  | 'EngineRepair'
  | 'AccidentRepair'
  | 'Other'

export interface MaintenanceLog {
  id: number
  vehicleId: number
  maintenanceType: MaintenanceType
  serviceProvider: string | null
  serviceDate: string
  odometerReading: string | null
  serviceCost: string | null
  nextServiceDate: string | null
  nextServiceOdometer: string | null
  notes: string | null
  vehicle: Vehicle
}

export interface MaintenanceLogStats {
  totalServices: number
  totalCost: number
  dueServices: number
}

interface MaintenanceLogListResponse {
  success: true
  data: { maintenanceLogs: MaintenanceLog[] }
}

interface MaintenanceLogStatsResponse {
  success: true
  data: MaintenanceLogStats
}

export function list() {
  return api.get<MaintenanceLogListResponse>('/maintenance-logs').then((r) => r.data.data.maintenanceLogs)
}

export function stats() {
  return api.get<MaintenanceLogStatsResponse>('/maintenance-logs/stats').then((r) => r.data.data)
}

export interface MaintenanceLogInput {
  vehicleId: number
  maintenanceType: MaintenanceType
  serviceProvider?: string
  serviceDate: string
  odometerReading?: number
  serviceCost?: number
  nextServiceDate?: string
  nextServiceOdometer?: number
  notes?: string
}

export function create(input: MaintenanceLogInput) {
  return api.post('/maintenance-logs', input)
}
