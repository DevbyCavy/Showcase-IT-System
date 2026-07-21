import type { Request, Response } from 'express'
import * as maintenanceLogService from '../services/maintenanceLog.service'

export async function list(_req: Request, res: Response) {
  const maintenanceLogs = await maintenanceLogService.list()
  res.json({ success: true, data: { maintenanceLogs } })
}

export async function stats(_req: Request, res: Response) {
  const data = await maintenanceLogService.stats()
  res.json({ success: true, data })
}

export async function create(req: Request, res: Response) {
  const maintenanceLog = await maintenanceLogService.create(req.body)
  res.status(201).json({ success: true, data: { maintenanceLog } })
}
