import { api } from './client'
import type { AuthUser } from '@/types/auth'

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'
export type VehicleStatus = 'Available' | 'OnTrip' | 'UnderMaintenance' | 'OutOfService'

export interface Vehicle {
  id: number
  registrationNumber: string
  make: string
  model: string
  vehicleYear: number
  color: string
  fuelType: FuelType
  capacity: string
  department: string
  assignedUserId: number | null
  assignedUser: AuthUser | null
  status: VehicleStatus
  purchaseDate: string
  notes: string | null
}

interface VehicleResponse {
  success: true
  data: { vehicle: Vehicle }
}

interface VehicleListResponse {
  success: true
  data: { vehicles: Vehicle[] }
}

export function list() {
  return api.get<VehicleListResponse>('/vehicles').then((r) => r.data.data.vehicles)
}

export interface VehicleInput {
  registrationNumber: string
  make: string
  model: string
  vehicleYear?: number
  color?: string
  fuelType?: FuelType
  capacity?: string
  department?: string
  assignedUserId?: number | null
  status?: VehicleStatus
  purchaseDate?: string
  notes?: string
}

export function create(input: VehicleInput) {
  return api.post<VehicleResponse>('/vehicles', input).then((r) => r.data.data.vehicle)
}

export function update(id: number, input: VehicleInput) {
  return api.put<VehicleResponse>(`/vehicles/${id}`, input).then((r) => r.data.data.vehicle)
}

export function remove(id: number) {
  return api.delete(`/vehicles/${id}`)
}
