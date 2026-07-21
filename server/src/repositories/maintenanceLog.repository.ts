import { prisma } from '../config/prisma'

export interface MaintenanceLogData {
  vehicleId: number
  maintenanceType: 'Service' | 'OilChange' | 'TyreReplacement' | 'BrakeRepair' | 'EngineRepair' | 'AccidentRepair' | 'Other'
  serviceProvider?: string
  serviceDate: Date
  odometerReading?: number
  serviceCost?: number
  nextServiceDate?: Date
  nextServiceOdometer?: number
  notes?: string
}

export function create(data: MaintenanceLogData) {
  return prisma.maintenanceLog.create({ data })
}

// Mirrors maintananceLog.php's history table: `INNER JOIN vehicles ... ORDER BY service_date DESC`.
export function findAll() {
  return prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { serviceDate: 'desc' },
  })
}

// Mirrors the three stat-card queries. "Due soon" preserves the legacy's exact predicate
// (`next_service_date <= CURDATE() + 30 days`, no lower bound — overdue services count too).
export async function stats() {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const [totalServices, aggregates, dueServices] = await Promise.all([
    prisma.maintenanceLog.count(),
    prisma.maintenanceLog.aggregate({ _sum: { serviceCost: true } }),
    prisma.maintenanceLog.count({ where: { nextServiceDate: { lte: in30Days } } }),
  ])
  return {
    totalServices,
    totalCost: aggregates._sum.serviceCost ?? 0,
    dueServices,
  }
}
