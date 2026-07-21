import type { Request, Response } from 'express'
import * as fuelLogService from '../services/fuelLog.service'

export async function stats(_req: Request, res: Response) {
  const data = await fuelLogService.stats()
  res.json({ success: true, data })
}

export async function create(req: Request, res: Response) {
  const fuelLog = await fuelLogService.create(req.body)
  res.status(201).json({ success: true, data: { fuelLog } })
}
