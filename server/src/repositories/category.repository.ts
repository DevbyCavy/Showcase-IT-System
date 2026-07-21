import { prisma } from '../config/prisma'

// Mirrors fetchCategories.php: `WHERE categories_status = 1` (soft-delete filter).
export function findAllActive() {
  return prisma.category.findMany({ where: { status: 'Active' } })
}

export function findById(id: number) {
  return prisma.category.findUnique({ where: { id } })
}

export function create(data: { name: string; isActive: boolean }) {
  return prisma.category.create({ data: { ...data, status: 'Active' } })
}

export function update(id: number, data: { name: string; isActive: boolean }) {
  return prisma.category.update({ where: { id }, data })
}

// Mirrors removeCategories.php: soft-delete via categories_status = 2, never a real DELETE.
export function softDelete(id: number) {
  return prisma.category.update({ where: { id }, data: { status: 'Deleted' } })
}
