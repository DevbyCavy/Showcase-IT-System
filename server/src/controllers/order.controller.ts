import type { Request, Response } from 'express'
import * as orderService from '../services/order.service'
import { ApiError } from '../middleware/errorHandler'
import { publicUploadPath } from '../middleware/upload'
import type { UploadedOrderFiles } from '../services/order.service'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid order id')
  }
  return id
}

function extractFiles(req: Request): UploadedOrderFiles {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  const boq = files?.boqFile?.[0]
  const artwork = files?.artworkFile?.[0]
  return {
    ...(boq ? { boqFile: publicUploadPath('orders', boq.filename) } : {}),
    ...(artwork ? { artworkFile: publicUploadPath('orders', artwork.filename) } : {}),
  }
}

export async function list(_req: Request, res: Response) {
  const orders = await orderService.list()
  res.json({ success: true, data: { orders } })
}

export async function create(req: Request, res: Response) {
  const order = await orderService.create(req.body, extractFiles(req))
  res.status(201).json({ success: true, data: { order } })
}

export async function update(req: Request, res: Response) {
  const order = await orderService.update(parseId(req), req.body, extractFiles(req))
  res.json({ success: true, data: { order } })
}

export async function updateStatus(req: Request, res: Response) {
  const order = await orderService.updateStatus(parseId(req), req.body.status)
  res.json({ success: true, data: { order } })
}
