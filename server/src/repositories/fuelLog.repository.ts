import { prisma } from '../config/prisma'

export interface FuelLogData {
  vehicleId: number
  fuelDate: Date
  odometerReading: number
  litres: number
  fuelCost: number
  fuelStation?: string
  receiptNumber?: string
  notes?: string
}

export function create(data: FuelLogData) {
  return prisma.fuelLog.create({ data })
}

// Mirrors fuelLog.php's three summary queries — the legacy page shows these stat cards plus the
// add-entry form, and nothing else (no history/list table exists anywhere for fuel_logs).
export async function stats() {
  const [totalEntries, aggregates] = await Promise.all([
    prisma.fuelLog.count(),
    prisma.fuelLog.aggregate({ _sum: { litres: true, fuelCost: true } }),
  ])
  return {
    totalEntries,
    totalLitres: aggregates._sum.litres ?? 0,
    totalFuelCost: aggregates._sum.fuelCost ?? 0,
  }
}
