import { prisma } from '../config/prisma'

export function findByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}

export function findById(id: number) {
  return prisma.user.findUnique({ where: { id } })
}
