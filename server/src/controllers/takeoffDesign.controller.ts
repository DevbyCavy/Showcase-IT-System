import type { Request, Response } from 'express'
import * as takeoffDesignService from '../services/takeoffDesign.service'
import { ApiError } from '../middleware/errorHandler'
import { renderTakeoffXlsx } from '../utils/takeoffXlsx'
import { renderTakeoffQuotationPdf } from '../utils/takeoffQuotationPdf'

function parseId(param: string | string[] | undefined, label: string): number {
  const id = Number(param)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label} id`)
  }
  return id
}

export async function getOne(req: Request, res: Response) {
  const design = await takeoffDesignService.getOne(parseId(req.params.id, 'design'), req.user!.id)
  res.json({ success: true, data: { design } })
}

export async function updateItem(req: Request, res: Response) {
  const item = await takeoffDesignService.updateItem(
    parseId(req.params.id, 'design'),
    parseId(req.params.itemId, 'item'),
    req.body,
    req.user!.id,
  )
  res.json({ success: true, data: { item } })
}

export async function exportXlsx(req: Request, res: Response) {
  const design = await takeoffDesignService.getForExport(parseId(req.params.id, 'design'), req.user!.id)
  const buffer = await renderTakeoffXlsx(design)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="Takeoff_${design.id}.xlsx"`)
  res.send(buffer)
}

export async function exportQuotationPdf(req: Request, res: Response) {
  const design = await takeoffDesignService.getForExport(parseId(req.params.id, 'design'), req.user!.id)
  const pdfBuffer = await renderTakeoffQuotationPdf(design)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="Takeoff_BOQ_${design.id}.pdf"`)
  res.send(pdfBuffer)
}
