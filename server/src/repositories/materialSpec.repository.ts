import { prisma } from '../config/prisma'

export function findAll() {
  return prisma.materialSpec.findMany({ orderBy: { name: 'asc' } })
}

export function findById(id: number) {
  return prisma.materialSpec.findUnique({ where: { id } })
}

export interface MaterialSpecData {
  name: string
  unit: string
  standardSheetWmm?: number | null
  standardSheetHmm?: number | null
  typicalThicknessMm: number[]
  standardLengthsMm: number[]
  wasteFactor: number
  unitCost?: number | null
}

export function create(data: MaterialSpecData) {
  return prisma.materialSpec.create({ data })
}

export function update(id: number, data: MaterialSpecData) {
  return prisma.materialSpec.update({ where: { id }, data })
}

export function remove(id: number) {
  return prisma.materialSpec.delete({ where: { id } })
}
