// Mirrors the reference/seed data in stock.sql so the new system starts from the same baseline.
//
// User passwords: stock.sql mixes plain MD5, PHP crypt(), and bcrypt hashes (see
// MIGRATION_PLAN.md §2.3) — none of those are portable to this system, which standardizes on
// bcrypt. Seeded users get a placeholder password (logged below) instead of a ported hash; real
// credential migration/reset is a Module 2 (Auth) task, not a Module 1 (Database) concern.

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const PLACEHOLDER_PASSWORD = 'ChangeMe123!'

async function main() {
  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 10)

  await prisma.brand.createMany({
    data: [
      { name: 'Total', isActive: false, status: 'Deleted' },
      { name: 'Total', isActive: true, status: 'Active' },
      { name: 'Total', isActive: true, status: 'Deleted' },
      { name: 'Penanel Vinyl 50m (1600mm)', isActive: true, status: 'Deleted' },
      { name: 'GlueDevil', isActive: true, status: 'Active' },
      { name: 'Econo-Print', isActive: true, status: 'Active' },
      { name: 'Penanel', isActive: true, status: 'Deleted' },
    ],
  })

  await prisma.category.createMany({
    data: [
      { name: 'Penanel', isActive: true, status: 'Deleted' },
      { name: 'Spray Paint', isActive: true, status: 'Deleted' },
      { name: 'Vinyl', isActive: false, status: 'Active' },
      { name: 'Fan', isActive: true, status: 'Active' },
    ],
  })

  const glueDevil = await prisma.brand.findFirst({ where: { name: 'GlueDevil' } })
  const vinyl = await prisma.category.findFirst({ where: { name: 'Vinyl' } })
  if (glueDevil && vinyl) {
    await prisma.product.create({
      data: {
        name: 'Product',
        code: '',
        imageUrl: 'assets/images/stock/img_69175b2ad08982.79646502.jpg',
        brandId: glueDevil.id,
        categoryId: vinyl.id,
        quantity: 20,
        rate: 11,
        isActive: true,
        status: 'Active',
      },
    })
  }

  // Legacy `admin` (user_id 1) had user_type '' — unroutable at login today (falls to the dead
  // `default` branch, see MIGRATION_PLAN.md §2.2). Assumed SuperAdmin here since the username
  // implies it; flag to Calvin to confirm/correct before this seed is used for anything real.
  const users: { username: string; name: string; surname: string; userType: Role; department: string; email: string }[] = [
    { username: 'admin', name: '', surname: '', userType: Role.SuperAdmin, department: 'Super Admin', email: 'calvinfonso17@gmail.com' },
    { username: 'jdoe', name: 'John', surname: 'Doe', userType: Role.StoresAdmin, department: 'Stores', email: '' },
    { username: '@cavy', name: 'Calvin', surname: 'Fonso', userType: Role.StoresAdmin, department: 'Stores Admin', email: 'calvinfonso17@gmail.com' },
    { username: '@superkey', name: 'Munashe', surname: 'Fonso', userType: Role.SuperAdmin, department: 'Super Admin', email: 'calvinfonso17@gmail.com' },
    { username: 'ruru', name: 'Rufaro', surname: 'Doe', userType: Role.StoresAdmin, department: 'Stores Admin', email: 'calvinfonso17@gmail.com' },
    { username: 'tk', name: 'Tanaka', surname: 'Chisaya', userType: Role.ProductionTeam, department: 'Production', email: '' },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash },
    })
  }

  console.log(`Seed complete. All seeded users share the placeholder password: ${PLACEHOLDER_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
