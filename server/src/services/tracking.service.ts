import { ApiError } from '../middleware/errorHandler'
import * as trackingRepository from '../repositories/tracking.repository'
import type { LocationPingBody } from '../validations/tracking.validation'
import type { AuthenticatedUser } from '../types/auth.types'
import { toPublicUser } from '../utils/mapUser'

// Shared by start/update/end — all three are just "record a GPS ping," gated the same way: the
// trip must exist, be Active, and belong to the requesting user. Prevents anyone from posting fake
// location pings for a trip that isn't theirs (the spec's "users can only update their own
// vehicle" requirement).
async function recordPing(user: AuthenticatedUser, input: LocationPingBody) {
  const trip = await trackingRepository.findTripForOwnershipCheck(input.tripId)
  if (!trip) {
    throw new ApiError(404, 'Trip not found.')
  }
  if (trip.userId !== user.id) {
    throw new ApiError(403, 'You can only report location for your own trip.')
  }
  if (trip.tripStatus !== 'Active') {
    throw new ApiError(400, 'This trip is not active.')
  }

  return trackingRepository.create({
    tripId: input.tripId,
    vehicleId: trip.vehicleId,
    userId: user.id,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    speed: input.speed,
    heading: input.heading,
  })
}

export const start = recordPing
export const update = recordPing
export const end = recordPing

export async function live() {
  const rows = await trackingRepository.findLive()
  const onlineCutoff = Date.now() - trackingRepository.ONLINE_WINDOW_MS

  return rows.map(({ trip, lastLocation }) => ({
    tripId: trip.id,
    vehicle: {
      id: trip.vehicle.id,
      registrationNumber: trip.vehicle.registrationNumber,
      make: trip.vehicle.make,
      model: trip.vehicle.model,
      department: trip.vehicle.department,
    },
    driver: toPublicUser(trip.user),
    destination: trip.destination,
    departureDatetime: trip.departureDatetime,
    lastLocation: lastLocation
      ? {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          accuracy: lastLocation.accuracy,
          speed: lastLocation.speed,
          heading: lastLocation.heading,
          timestamp: lastLocation.timestamp,
        }
      : null,
    isOnline: lastLocation ? lastLocation.timestamp.getTime() >= onlineCutoff : false,
  }))
}

// Haversine distance between two lat/lng points, in kilometers.
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export async function history(tripId: number) {
  const trip = await trackingRepository.findTripForOwnershipCheck(tripId)
  if (!trip) {
    throw new ApiError(404, 'Trip not found.')
  }
  const points = await trackingRepository.findHistory(tripId)

  let gpsDistanceKm = 0
  for (let i = 1; i < points.length; i++) {
    gpsDistanceKm += haversineKm(
      { lat: Number(points[i - 1].latitude), lng: Number(points[i - 1].longitude) },
      { lat: Number(points[i].latitude), lng: Number(points[i].longitude) },
    )
  }

  const first = points[0]
  const last = points[points.length - 1]
  const durationMinutes = first && last ? (last.timestamp.getTime() - first.timestamp.getTime()) / 60000 : 0
  const averageSpeed = durationMinutes > 0 ? gpsDistanceKm / (durationMinutes / 60) : 0

  return {
    points: points.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy,
      speed: p.speed,
      heading: p.heading,
      timestamp: p.timestamp,
    })),
    gpsDistanceKm,
    durationMinutes,
    averageSpeed,
  }
}

export function stats() {
  return trackingRepository.stats()
}
