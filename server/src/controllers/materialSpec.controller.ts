import type { Request, Response } from 'express'
import * as materialSpecService from '../services/materialSpec.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid material id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const materials = await materialSpecService.list()
  res.json({ success: true, data: { materials } })
}

export async function create(req: Request, res: Response) {
  const material = await materialSpecService.create(req.body)
  res.status(201).json({ success: true, data: { material } })
}

export async function update(req: Request, res: Response) {
  const material = await materialSpecService.update(parseId(req), req.body)
  res.json({ success: true, data: { material } })
}

export async function remove(req: Request, res: Response) {
  await materialSpecService.remove(parseId(req))
  res.json({ success: true, data: null })
}
