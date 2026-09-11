// Security-audit hardening: no request throttling existed anywhere, so both the API in general
// and /api/auth/login in particular (a credential-stuffing/brute-force target) were unlimited.
import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
})

// Tighter cap specifically for login attempts — the rest of /api/auth (refresh/logout/me) stays
// under the global limiter only, since those aren't credential-guessing targets.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
})
