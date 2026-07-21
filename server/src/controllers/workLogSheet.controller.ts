import type { Request, Response } from 'express'
import * as workLogSheetService from '../services/workLogSheet.service'
import { ApiError } from '../middleware/errorHandler'

function parseTaskId(req: Request): number {
  const id = Number(req.params.taskId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid task id')
  }
  return id
}

export async function getToday(req: Request, res: Response) {
  const data = await workLogSheetService.getToday(req.user!.id)
  res.json({ success: true, data })
}

export async function startShift(req: Request, res: Response) {
  const data = await workLogSheetService.startShift(req.user!.id)
  res.json({ success: true, data })
}

export async function startTask(req: Request, res: Response) {
  const task = await workLogSheetService.startTask(req.user!.id, req.body)
  res.status(201).json({ success: true, data: { task } })
}

export async function stopTask(req: Request, res: Response) {
  const task = await workLogSheetService.stopTask(req.user!.id, parseTaskId(req))
  res.json({ success: true, data: { task } })
}

export async function toggleEveningShift(req: Request, res: Response) {
  const shift = await workLogSheetService.toggleEveningShift(req.user!.id)
  res.json({ success: true, data: { shift } })
}

export async function getWeekLog(req: Request, res: Response) {
  const data = await workLogSheetService.getWeekLog(req.user!.id)
  res.json({ success: true, data })
}
