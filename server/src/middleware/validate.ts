import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { ApiError } from './errorHandler'

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join('; ')
      return next(new ApiError(400, message))
    }
    req.body = result.data
    next()
  }
}
