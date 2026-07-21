import { prisma } from '../config/prisma'

// Mirrors vehicleDocuments.php's history table: `INNER JOIN vehicles ... ORDER BY expiry_date ASC`.
export function findAll() {
  return prisma.vehicleDocument.findMany({ include: { vehicle: true }, orderBy: { expiryDate: 'asc' } })
}

export function findById(id: number) {
  return prisma.vehicleDocument.findUnique({ where: { id } })
}

export async function stats() {
  const [totalDocs, expiredDocs, expiringDocs] = await Promise.all([
    prisma.vehicleDocument.count(),
    prisma.vehicleDocument.count({ where: { status: 'Expired' } }),
    prisma.vehicleDocument.count({ where: { status: 'ExpiringSoon' } }),
  ])
  return { totalDocs, expiredDocs, expiringDocs }
}

export interface VehicleDocumentData {
  vehicleId: number
  documentType: 'VehicleLicense' | 'Insurance' | 'FitnessCertificate' | 'RadioLicense' | 'Other'
  documentNumber: string
  issueDate: Date
  expiryDate: Date
  reminderDays: number
  status: 'Valid' | 'ExpiringSoon' | 'Expired'
  uploadedFile?: string
  notes?: string
}

export function create(data: VehicleDocumentData) {
  return prisma.vehicleDocument.create({ data, include: { vehicle: true } })
}

// Renew/edit is new (see MIGRATION_PLAN.md — vehicleDocuments.php's "Renew" link went to
// renewDocument.php, which never existed, same class of dead link as editOrder.php). If no new
// file is uploaded, `data.uploadedFile` is undefined and Prisma simply leaves the column untouched.
export function update(id: number, data: VehicleDocumentData) {
  return prisma.vehicleDocument.update({ where: { id }, data, include: { vehicle: true } })
}
