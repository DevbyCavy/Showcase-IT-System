import { prisma } from '../config/prisma'

const include = { vehicle: true, user: true } as const

export function findActive() {
  return prisma.vehicleTrip.findMany({ where: { tripStatus: 'Active' }, include, orderBy: { id: 'desc' } })
}

export function findHistory() {
  return prisma.vehicleTrip.findMany({ where: { tripStatus: 'Completed' }, include, orderBy: { id: 'desc' } })
}

export function findById(id: number) {
  return prisma.vehicleTrip.findUnique({ where: { id }, include })
}

export async function stats() {
  const [totalTrips, activeTripCount, aggregate] = await Promise.all([
    prisma.vehicleTrip.count(),
    prisma.vehicleTrip.count({ where: { tripStatus: 'Active' } }),
    prisma.vehicleTrip.aggregate({ _sum: { distanceTravelled: true } }),
  ])
  return { totalTrips, activeTripCount, totalDistance: aggregate._sum.distanceTravelled ?? 0 }
}

export interface CreateTripData {
  vehicleId: number
  userId: number
  destination: string
  purpose?: string
  departureDatetime: Date
  odometerStart: number
}

export type CreateTripResult = { error: string; trip?: undefined } | { error?: undefined; trip: TripWithRelations }
export type TripWithRelations = Awaited<ReturnType<typeof findActive>>[number]

// Mirrors tripLogbook.php's create_trip: check vehicle is Available, insert the trip, flip the
// vehicle to On Trip — done as one transaction (the legacy ran these as separate unguarded
// queries).
export function create(data: CreateTripData): Promise<CreateTripResult> {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } })
    if (!vehicle) {
      return { error: 'Vehicle not found.' }
    }
    if (vehicle.status !== 'Available') {
      return { error: 'Vehicle is not available for assignment.' }
    }

    // Flip the vehicle first so the trip's nested `vehicle` snapshot reflects the post-update
    // status, not the stale pre-update one.
    await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'OnTrip' } })
    const trip = await tx.vehicleTrip.create({
      data: { ...data, tripStatus: 'Active' },
      include,
    })

    return { trip }
  })
}

export interface EndTripData {
  returnDatetime: Date
  odometerEnd: number
  remarks?: string
}

// Mirrors tripLogbook.php's end_trip: compute distance, mark Completed, flip the vehicle back to
// Available — as one transaction.
export function end(tripId: number, data: EndTripData): Promise<CreateTripResult> {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.vehicleTrip.findUnique({ where: { id: tripId } })
    if (!trip) {
      return { error: 'Trip not found.' }
    }

    const distanceTravelled = data.odometerEnd - Number(trip.odometerStart)

    // Flip the vehicle first so the trip's nested `vehicle` snapshot reflects the post-update status.
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'Available' } })
    const updated = await tx.vehicleTrip.update({
      where: { id: tripId },
      data: {
        returnDatetime: data.returnDatetime,
        odometerEnd: data.odometerEnd,
        distanceTravelled,
        remarks: data.remarks,
        tripStatus: 'Completed',
      },
      include,
    })

    return { trip: updated }
  })
}
