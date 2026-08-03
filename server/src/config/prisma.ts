import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '#prisma-client'
import { env } from './env'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

export const prisma = new PrismaClient({ adapter })
