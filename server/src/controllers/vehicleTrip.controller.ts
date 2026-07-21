import type { Request, Response } from 'express'
import * as vehicleTripService from '../services/vehicleTrip.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid trip id')
  }
  return id
}

export async function stats(_req: Request, res: Response) {
  const data = await vehicleTripService.stats()
  res.json({ success: true, data })
}

export async function availableVehicles(_req: Request, res: Response) {
  const vehicles = await vehicleTripService.availableVehicles()
  res.json({ success: true, data: { vehicles } })
}

export async function active(_req: Request, res: Response) {
  const trips = await vehicleTripService.active()
  res.json({ success: true, data: { trips } })
}

export async function history(_req: Request, res: Response) {
  const trips = await vehicleTripService.history()
  res.json({ success: true, data: { trips } })
}

export async function create(req: Request, res: Response) {
  const trip = await vehicleTripService.create(req.body)
  res.status(201).json({ success: true, data: { trip } })
}

export async function end(req: Request, res: Response) {
  const trip = await vehicleTripService.end(parseId(req), req.body)
  res.json({ success: true, data: { trip } })
}
