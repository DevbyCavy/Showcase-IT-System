import type { Request, Response } from 'express'
import * as taskCalendarService from '../services/taskCalendar.service'

export async function getCalendar(req: Request, res: Response) {
  const now = new Date()
  const year = Number(req.query.year) || now.getFullYear()
  const month = Number(req.query.month) || now.getMonth() + 1
  const data = await taskCalendarService.getCalendar(req.user!.id, year, month)
  res.json({ success: true, data })
}

export async function quickAddMemo(req: Request, res: Response) {
  const memo = await taskCalendarService.quickAddMemo(req.user!.id, req.body)
  res.status(201).json({ success: true, data: { memoId: memo.id } })
}

export async function createOfficeTask(req: Request, res: Response) {
  const task = await taskCalendarService.createOfficeTask(req.user!.id, req.body)
  res.status(201).json({ success: true, data: { taskId: task.id } })
}
