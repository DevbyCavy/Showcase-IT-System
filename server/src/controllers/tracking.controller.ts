import type { Request, Response } from 'express'
import * as trackingService from '../services/tracking.service'
import { ApiError } from '../middleware/errorHandler'

function parseTripId(req: Request): number {
  const id = Number(req.params.tripId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid trip id')
  }
  return id
}

export async function start(req: Request, res: Response) {
  const location = await trackingService.start(req.user!, req.body)
  res.status(201).json({ success: true, data: { location } })
}

export async function update(req: Request, res: Response) {
  const location = await trackingService.update(req.user!, req.body)
  res.status(201).json({ success: true, data: { location } })
}

export async function end(req: Request, res: Response) {
  const location = await trackingService.end(req.user!, req.body)
  res.status(201).json({ success: true, data: { location } })
}

export async function live(_req: Request, res: Response) {
  const vehicles = await trackingService.live()
  res.json({ success: true, data: { vehicles } })
}

export async function history(req: Request, res: Response) {
  const data = await trackingService.history(parseTripId(req))
  res.json({ success: true, data })
}

export async function stats(_req: Request, res: Response) {
  const data = await trackingService.stats()
  res.json({ success: true, data })
}
