// Mirrors php_action/auth_guard.php's two concerns — "is there a valid session" and "does this
// session's role match" — as JWT + RBAC middleware instead of PHP session checks.

import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from '../config/env'
import { ApiError } from './errorHandler'
import type { AccessTokenPayload, AuthenticatedUser } from '../types/auth.types'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    return next(new ApiError(401, 'Not authenticated'))
  }

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
    next()
  } catch {
    next(new ApiError(401, 'Invalid or expired token'))
  }
}

/// Equivalent of requireRole($role) in auth_guard.php, but accepts multiple roles —
/// the legacy version only ever supported one, which was part of why the role strings drifted.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied'))
    }
    next()
  }
}
