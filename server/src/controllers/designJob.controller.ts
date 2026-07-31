import type { Request, Response } from 'express'
import * as designJobService from '../services/designJob.service'
import { ApiError } from '../middleware/errorHandler'
import { publicUploadPath } from '../middleware/upload'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid design job id')
  }
  return id
}

function extractFile(req: Request): string | undefined {
  const file = req.file
  return file ? publicUploadPath('design-jobs', file.filename) : undefined
}

export async function list(req: Request, res: Response) {
  const designJobs = await designJobService.list(req.user!)
  res.json({ success: true, data: { designJobs } })
}

export async function create(req: Request, res: Response) {
  const designJob = await designJobService.create(req.body, req.user!.id, extractFile(req))
  res.status(201).json({ success: true, data: { designJob } })
}

export async function markDone(req: Request, res: Response) {
  const completedFile = extractFile(req)
  if (!completedFile) {
    throw new ApiError(400, 'Please attach the completed design (PNG, JPEG, or PDF).')
  }
  const designJob = await designJobService.markDone(parseId(req), req.user!.id, completedFile)
  res.json({ success: true, data: { designJob } })
}
