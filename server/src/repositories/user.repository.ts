import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'

export function findByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}

export function findById(id: number) {
  return prisma.user.findUnique({ where: { id } })
}

// Mirrors manage_users.php: `SELECT * FROM users ORDER BY user_id DESC`
export function findAll() {
  return prisma.user.findMany({ orderBy: { id: 'desc' } })
}

export function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data })
}

export function update(id: number, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data })
}

export function remove(id: number) {
  return prisma.user.delete({ where: { id } })
}
