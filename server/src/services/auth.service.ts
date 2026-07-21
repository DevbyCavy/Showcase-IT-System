// Translated from index.php's login handler. Preserves the original's behavior of never
// revealing whether the username or the password was wrong (both cases return the same generic
// "Incorrect username or password" error) and of hashing/verifying via bcrypt — password_verify()
// in the legacy code, bcrypt.compare() here (see MIGRATION_PLAN.md §2.3 for why hashes aren't
// ported as-is).

import bcrypt from 'bcrypt'
import { ApiError } from '../middleware/errorHandler'
import * as userRepository from '../repositories/user.repository'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.service'
import { toPublicUser } from '../utils/mapUser'

export interface LoginInput {
  username: string
  password: string
}

export async function login({ username, password }: LoginInput) {
  const user = await userRepository.findByUsername(username)

  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false
  if (!user || !isValid) {
    throw new ApiError(401, 'Incorrect username or password')
  }

  const accessToken = signAccessToken({ id: user.id, username: user.username, role: user.userType })
  const refreshToken = signRefreshToken({ id: user.id })

  return { user: toPublicUser(user), accessToken, refreshToken }
}

export async function refresh(refreshToken: string) {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token')
  }

  const user = await userRepository.findById(payload.id)
  if (!user) {
    throw new ApiError(401, 'User no longer exists')
  }

  const accessToken = signAccessToken({ id: user.id, username: user.username, role: user.userType })
  return { user: toPublicUser(user), accessToken }
}

export async function me(userId: number) {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  return toPublicUser(user)
}
