import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: `Not found: ${req.method} ${req.originalUrl}` })
}

// All four params are required so Express recognizes this as error-handling middleware (arity-based).
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500

  if (status === 500) {
    console.error('Unhandled error:', err)
    if (err instanceof Error) console.error(err.stack)
  }

  // ApiError messages are always our own deliberate, safe-to-show text (validation errors, "not
  // found", "access denied", etc). Anything else is an unexpected/unhandled error — in production
  // those can carry internal detail (Prisma messages, file paths, library internals), so only
  // surface the generic message to the client and keep the real one in the server log above.
  const message =
    err instanceof ApiError
      ? err.message
      : env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err instanceof Error
          ? err.message
          : 'Internal server error'

  res.status(status).json({ success: false, error: message })
}
