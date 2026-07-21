import type { Request, Response } from 'express'
import * as vehicleService from '../services/vehicle.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid vehicle id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const vehicles = await vehicleService.list()
  res.json({ success: true, data: { vehicles } })
}

export async function getOne(req: Request, res: Response) {
  const vehicle = await vehicleService.getOne(parseId(req))
  res.json({ success: true, data: { vehicle } })
}

export async function create(req: Request, res: Response) {
  const vehicle = await vehicleService.create(req.body)
  res.status(201).json({ success: true, data: { vehicle } })
}

export async function update(req: Request, res: Response) {
  const vehicle = await vehicleService.update(parseId(req), req.body)
  res.json({ success: true, data: { vehicle } })
}

export async function remove(req: Request, res: Response) {
  await vehicleService.remove(parseId(req))
  res.json({ success: true })
}
