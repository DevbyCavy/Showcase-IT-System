import { prisma } from '../config/prisma'

// Mirrors fetchBrand.php: `WHERE brand_status = 1` (soft-delete filter).
export function findAllActive() {
  return prisma.brand.findMany({ where: { status: 'Active' } })
}

export function findById(id: number) {
  return prisma.brand.findUnique({ where: { id } })
}

// Mirrors the product form's brand dropdown query: `WHERE brand_status = 1 AND brand_active = 1`.
export function findAllAvailable() {
  return prisma.brand.findMany({ where: { status: 'Active', isActive: true } })
}

export function create(data: { name: string; isActive: boolean }) {
  return prisma.brand.create({ data: { ...data, status: 'Active' } })
}

export function update(id: number, data: { name: string; isActive: boolean }) {
  return prisma.brand.update({ where: { id }, data })
}

// Mirrors removeBrand.php: soft-delete via brand_status = 2, never a real DELETE.
export function softDelete(id: number) {
  return prisma.brand.update({ where: { id }, data: { status: 'Deleted' } })
}
