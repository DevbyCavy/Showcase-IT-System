import type { Request, Response } from 'express'
import * as requisitionService from '../services/requisition.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid requisition id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const requisitions = await requisitionService.list()
  res.json({ success: true, data: { requisitions } })
}

export async function create(req: Request, res: Response) {
  const requisition = await requisitionService.create(req.body, req.user!.id)
  res.status(201).json({ success: true, data: { requisition } })
}

export async function process(req: Request, res: Response) {
  const requisition = await requisitionService.process(parseId(req), req.user!.id)
  res.json({ success: true, data: { requisition } })
}
