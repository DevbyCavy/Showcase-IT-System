// Translated from signup.php (public self-registration, role picker excluding Super Admin) and
// the CRUD manage_users.php's dead Edit/Delete links implied but never shipped (see
// MIGRATION_PLAN.md — Module 3 completes this by decision).

import bcrypt from 'bcrypt'
import { ApiError } from '../middleware/errorHandler'
import * as userRepository from '../repositories/user.repository'
import type { SignupBody, UpdateUserBody } from '../validations/user.validation'
import { toPublicUser } from '../utils/mapUser'

export async function list() {
  const users = await userRepository.findAll()
  return users.map(toPublicUser)
}

export async function signup(input: SignupBody) {
  const existing = await userRepository.findByUsername(input.username)
  if (existing) {
    throw new ApiError(409, 'Username already exists')
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await userRepository.create({
    name: input.name,
    surname: input.surname,
    username: input.username,
    passwordHash,
    userType: input.userType,
    department: input.department,
    email: input.email ?? '',
  })

  return toPublicUser(user)
}

export async function update(id: number, input: UpdateUserBody) {
  const user = await userRepository.findById(id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (input.username && input.username !== user.username) {
    const existing = await userRepository.findByUsername(input.username)
    if (existing) {
      throw new ApiError(409, 'Username already exists')
    }
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined

  const updated = await userRepository.update(id, {
    name: input.name,
    surname: input.surname,
    username: input.username,
    department: input.department,
    userType: input.userType,
    email: input.email,
    ...(passwordHash ? { passwordHash } : {}),
  })

  return toPublicUser(updated)
}

export async function remove(id: number) {
  const user = await userRepository.findById(id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  await userRepository.remove(id)
}
