// Mirrors the Role enum in server/prisma/schema.prisma. Prisma serializes enum values using the
// TS identifier (e.g. "SuperAdmin"), not the @map'd display string ("Super Admin") — the display
// string is a DB-only concern.
export type Role =
  | 'SuperAdmin'
  | 'StoresAdmin'
  | 'ProjectManager'
  | 'Accountant'
  | 'GraphicDesigner'
  | 'ProductionTeam'
  | 'Logistics'
  | 'Marketer'

export interface AuthUser {
  id: number
  username: string
  name: string
  surname: string
  role: Role
  department: string
  email: string
  whatsappNumber: string | null
}
