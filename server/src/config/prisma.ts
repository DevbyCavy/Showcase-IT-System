import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '#prisma-client'
import { env } from './env'

// prisma is a module-level singleton (imported by every repository), so this pool is created once
// per running process, not per request. `max` is kept low and explicit — Hostinger's Postgres
// connection quota is small, and leaving it at pg's default (10) gives this one process room to
// exhaust it on its own, especially with an old instance briefly overlapping a new one during a
// redeploy. connectionTimeoutMillis makes a starved pool fail fast with a clear error instead of
// requests hanging indefinitely.
const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  },
  {
    onPoolError: (err) => console.error('Postgres pool error:', err),
    onConnectionError: (err) => console.error('Postgres connection error:', err),
  },
)

export const prisma = new PrismaClient({ adapter })
