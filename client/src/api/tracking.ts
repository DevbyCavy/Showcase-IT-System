import { api } from './client'
import type { AuthUser } from '@/types/auth'

export interface LocationPing {
  tripId: number
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
}

interface PingResponse {
  success: true
  data: { location: unknown }
}

export function start(ping: LocationPing) {
  return api.post<PingResponse>('/tracking/start', ping)
}

export function update(ping: LocationPing) {
  return api.post<PingResponse>('/tracking/update', ping)
}

export function end(ping: LocationPing) {
  return api.post<PingResponse>('/tracking/end', ping)
}

export interface LiveVehicleLocation {
  latitude: string
  longitude: string
  accuracy: string | null
  speed: string | null
  heading: string | null
  timestamp: string
}

export interface LiveVehicle {
  tripId: number
  vehicle: {
    id: number
    registrationNumber: string
    make: string
    model: string
    department: string
  }
  driver: AuthUser
  destination: string
  departureDatetime: string
  lastLocation: LiveVehicleLocation | null
  isOnline: boolean
}

interface LiveResponse {
  success: true
  data: { vehicles: LiveVehicle[] }
}

export function live() {
  return api.get<LiveResponse>('/tracking/live').then((r) => r.data.data.vehicles)
}

export interface HistoryPoint {
  latitude: string
  longitude: string
  accuracy: string | null
  speed: string | null
  heading: string | null
  timestamp: string
}

export interface TripHistory {
  points: HistoryPoint[]
  gpsDistanceKm: number
  durationMinutes: number
  averageSpeed: number
}

interface HistoryResponse {
  success: true
  data: TripHistory
}

export function history(tripId: number) {
  return api.get<HistoryResponse>(`/tracking/history/${tripId}`).then((r) => r.data.data)
}

export interface TrackingStats {
  vehiclesOnline: number
  vehiclesOffline: number
  tripsInProgress: number
  averageSpeed: number
  totalDistanceToday: number
}

interface StatsResponse {
  success: true
  data: TrackingStats
}

export function stats() {
  return api.get<StatsResponse>('/tracking/stats').then((r) => r.data.data)
}
