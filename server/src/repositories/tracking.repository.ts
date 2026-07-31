import { prisma } from '../config/prisma'

// A vehicle counts as "online" if it has pinged within this window — covers ~2 missed pings at
// the client's 15-30s reporting interval before flagging offline.
export const ONLINE_WINDOW_MS = 60_000

export interface CreatePingData {
  tripId: number
  vehicleId: number
  userId: number
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
}

export function create(data: CreatePingData) {
  return prisma.trackingLocation.create({ data })
}

// Ownership + trip-status check shared by start/update/end — only the trip's own driver can push
// location pings for it, and only while it's Active.
export function findTripForOwnershipCheck(tripId: number) {
  return prisma.vehicleTrip.findUnique({ where: { id: tripId }, select: { id: true, userId: true, vehicleId: true, tripStatus: true } })
}

const tripInclude = { vehicle: true, user: true } as const

// One row per currently-Active trip, each with its own most recent location (if any yet — a trip
// that just started and hasn't gotten its first GPS fix has no location rows).
export async function findLive() {
  const activeTrips = await prisma.vehicleTrip.findMany({ where: { tripStatus: 'Active' }, include: tripInclude, orderBy: { id: 'desc' } })
  const withLocation = await Promise.all(
    activeTrips.map(async (trip) => ({
      trip,
      lastLocation: await prisma.trackingLocation.findFirst({ where: { tripId: trip.id }, orderBy: { timestamp: 'desc' } }),
    })),
  )
  return withLocation
}

export function findHistory(tripId: number) {
  return prisma.trackingLocation.findMany({ where: { tripId }, orderBy: { timestamp: 'asc' } })
}

export async function stats() {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS)
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [totalVehicles, tripsInProgress, onlineVehicleIds, recentSpeeds, distanceAgg] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicleTrip.count({ where: { tripStatus: 'Active' } }),
    prisma.trackingLocation.findMany({ where: { timestamp: { gte: since } }, select: { vehicleId: true }, distinct: ['vehicleId'] }),
    prisma.trackingLocation.findMany({ where: { timestamp: { gte: since }, speed: { not: null } }, select: { speed: true } }),
    prisma.vehicleTrip.aggregate({ _sum: { distanceTravelled: true }, where: { returnDatetime: { gte: startOfToday } } }),
  ])

  const vehiclesOnline = onlineVehicleIds.length
  const averageSpeed = recentSpeeds.length
    ? recentSpeeds.reduce((sum, r) => sum + Number(r.speed ?? 0), 0) / recentSpeeds.length
    : 0

  return {
    vehiclesOnline,
    vehiclesOffline: Math.max(0, totalVehicles - vehiclesOnline),
    tripsInProgress,
    averageSpeed,
    totalDistanceToday: distanceAgg._sum.distanceTravelled ?? 0,
  }
}
