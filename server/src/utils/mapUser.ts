import type { User } from '@prisma/client'

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    surname: user.surname,
    role: user.userType,
    department: user.department,
    email: user.email,
  }
}
