import type { Request, Response } from 'express'
import * as brandService from '../services/brand.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid brand id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const brands = await brandService.list()
  res.json({ success: true, data: { brands } })
}

export async function getOne(req: Request, res: Response) {
  const brand = await brandService.getOne(parseId(req))
  res.json({ success: true, data: { brand } })
}

export async function create(req: Request, res: Response) {
  const brand = await brandService.create(req.body)
  res.status(201).json({ success: true, data: { brand } })
}

export async function update(req: Request, res: Response) {
  const brand = await brandService.update(parseId(req), req.body)
  res.json({ success: true, data: { brand } })
}

export async function remove(req: Request, res: Response) {
  await brandService.remove(parseId(req))
  res.json({ success: true })
}
