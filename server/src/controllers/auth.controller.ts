import type { CookieOptions, Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { ApiError } from '../middleware/errorHandler'
import { env } from '../config/env'

const REFRESH_COOKIE = 'refreshToken'

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(req.body)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
  res.json({ success: true, data: { user, accessToken } })
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (!token) {
    throw new ApiError(401, 'Not authenticated')
  }
  const { user, accessToken } = await authService.refresh(token)
  res.json({ success: true, data: { user, accessToken } })
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
  res.json({ success: true })
}

export async function me(req: Request, res: Response) {
  const user = await authService.me(req.user!.id)
  res.json({ success: true, data: { user } })
}
