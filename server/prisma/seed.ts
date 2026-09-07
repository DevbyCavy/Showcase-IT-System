// Mirrors the reference/seed data in stock.sql so the new system starts from the same baseline.
//
// User passwords: stock.sql mixes plain MD5, PHP crypt(), and bcrypt hashes (see
// MIGRATION_PLAN.md §2.3) — none of those are portable to this system, which standardizes on
// bcrypt. Seeded users get a placeholder password (logged below) instead of a ported hash; real
// credential migration/reset is a Module 2 (Auth) task, not a Module 1 (Database) concern.

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '../src/generated/prisma/client'
import bcrypt from 'bcrypt'
import { env } from '../src/config/env'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

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

  // AI Takeoff / BOQ Generator — starting material vocabulary, per the feature's design doc §4.
  const materialSpecs: {
    name: string
    unit: string
    standardSheetWmm?: number
    standardSheetHmm?: number
    typicalThicknessMm: number[]
    standardLengthsMm: number[]
    wasteFactor: number
  }[] = [
    { name: 'Supawood', unit: 'm2', standardSheetWmm: 2440, standardSheetHmm: 1220, typicalThicknessMm: [12, 16, 18], standardLengthsMm: [], wasteFactor: 1.1 },
    { name: 'Dibond', unit: 'm2', standardSheetWmm: 3050, standardSheetHmm: 1500, typicalThicknessMm: [3, 4], standardLengthsMm: [], wasteFactor: 1.1 },
    { name: 'Timber', unit: 'linear_m', typicalThicknessMm: [], standardLengthsMm: [1800, 2400, 3000, 3600], wasteFactor: 1.05 },
    { name: 'MDF', unit: 'm2', standardSheetWmm: 2440, standardSheetHmm: 1220, typicalThicknessMm: [6, 9, 12, 18], standardLengthsMm: [], wasteFactor: 1.1 },
  ]

  for (const m of materialSpecs) {
    await prisma.materialSpec.upsert({
      where: { name: m.name },
      update: {},
      create: m,
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
