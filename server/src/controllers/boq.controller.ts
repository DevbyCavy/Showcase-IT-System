import type { Request, Response } from 'express'
import * as boqService from '../services/boq.service'
import { ApiError } from '../middleware/errorHandler'
import { renderBoqPdf } from '../utils/boqPdf'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid BOQ id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const boqs = await boqService.list()
  res.json({ success: true, data: { boqs } })
}

export async function getOne(req: Request, res: Response) {
  const boq = await boqService.getOne(parseId(req))
  res.json({ success: true, data: { boq } })
}

export async function create(req: Request, res: Response) {
  const { boq, shortfallCount } = await boqService.create(req.body, req.user!.id)
  res.status(201).json({ success: true, data: { boq, shortfallCount } })
}

export async function downloadPdf(req: Request, res: Response) {
  const boq = await boqService.getOne(parseId(req))
  const pdfBuffer = await renderBoqPdf(boq)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="BOQ_${boq.boqNumber}.pdf"`)
  res.send(pdfBuffer)
}
