import type { Request, Response } from 'express'
import * as memoService from '../services/memo.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid memo id')
  }
  return id
}

export async function list(req: Request, res: Response) {
  const memos = await memoService.list(req.user!.id)
  res.json({ success: true, data: { memos } })
}

export async function create(req: Request, res: Response) {
  const memo = await memoService.create(req.user!.id, req.body)
  res.status(201).json({ success: true, data: { memo } })
}

export async function markDone(req: Request, res: Response) {
  await memoService.markDone(req.user!.id, parseId(req))
  res.json({ success: true })
}

export async function remove(req: Request, res: Response) {
  await memoService.remove(req.user!.id, parseId(req))
  res.json({ success: true })
}
