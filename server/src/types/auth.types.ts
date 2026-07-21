import type { Role } from '@prisma/client'

export interface AccessTokenPayload {
  id: number
  username: string
  role: Role
}

export interface AuthenticatedUser extends AccessTokenPayload {}
