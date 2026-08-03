import type { NextFunction, Request, Response } from 'express'

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
  const message = err instanceof Error ? err.message : 'Internal server error'

  if (status === 500) {
    console.error('Unhandled error:', err)
    if (err instanceof Error) console.error(err.stack)
  }

  res.status(status).json({ success: false, error: message })
}
