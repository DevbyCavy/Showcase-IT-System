import { api } from './client'
import type { Vehicle } from './vehicles'
import type { AuthUser } from '@/types/auth'

export type TripStatus = 'Active' | 'Completed'

export interface VehicleTrip {
  id: number
  vehicleId: number
  userId: number
  destination: string
  purpose: string | null
  departureDatetime: string
  returnDatetime: string | null
  odometerStart: string
  odometerEnd: string | null
  distanceTravelled: string | null
  remarks: string | null
  tripStatus: TripStatus
  vehicle: Vehicle
  driver: AuthUser
}

export interface TripStats {
  totalTrips: number
  activeTripCount: number
  totalDistance: number
}

export function stats() {
  return api.get<{ success: true; data: TripStats }>('/trips/stats').then((r) => r.data.data)
}

export function availableVehicles() {
  return api.get<{ success: true; data: { vehicles: Vehicle[] } }>('/trips/available-vehicles').then((r) => r.data.data.vehicles)
}

export function active() {
  return api.get<{ success: true; data: { trips: VehicleTrip[] } }>('/trips/active').then((r) => r.data.data.trips)
}

export function history() {
  return api.get<{ success: true; data: { trips: VehicleTrip[] } }>('/trips/history').then((r) => r.data.data.trips)
}

export interface CreateTripInput {
  vehicleId: number
  userId: number
  destination: string
  purpose?: string
  departureDatetime: string
  odometerStart: number
}

export function create(input: CreateTripInput) {
  return api.post('/trips', input)
}

export interface EndTripInput {
  returnDatetime: string
  odometerEnd: number
  remarks?: string
}

export function end(tripId: number, input: EndTripInput) {
  return api.put(`/trips/${tripId}/end`, input)
}
