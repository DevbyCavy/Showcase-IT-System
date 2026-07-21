import type { Request, Response } from 'express'
import * as vehicleDocumentService from '../services/vehicleDocument.service'
import { ApiError } from '../middleware/errorHandler'
import { publicUploadPath } from '../middleware/upload'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid document id')
  }
  return id
}

function extractFile(req: Request): string | undefined {
  return req.file ? publicUploadPath('vehicle_documents', req.file.filename) : undefined
}

export async function list(_req: Request, res: Response) {
  const documents = await vehicleDocumentService.list()
  res.json({ success: true, data: { documents } })
}

export async function stats(_req: Request, res: Response) {
  const data = await vehicleDocumentService.stats()
  res.json({ success: true, data })
}

export async function create(req: Request, res: Response) {
  const document = await vehicleDocumentService.create(req.body, extractFile(req))
  res.status(201).json({ success: true, data: { document } })
}

export async function update(req: Request, res: Response) {
  const document = await vehicleDocumentService.update(parseId(req), req.body, extractFile(req))
  res.json({ success: true, data: { document } })
}
