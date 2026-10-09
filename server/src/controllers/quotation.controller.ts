import type { Request, Response } from 'express'
import * as quotationService from '../services/quotation.service'
import * as proformaInvoiceService from '../services/proformaInvoice.service'
import { ApiError } from '../middleware/errorHandler'
import { publicUploadPath } from '../middleware/upload'
import { renderQuotationPdf, renderQuotationHtml } from '../utils/quotationPdf'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid quotation id')
  }
  return id
}

function extractDesignFile(req: Request): string | undefined {
  const file = req.file
  return file ? publicUploadPath('quotations', file.filename) : undefined
}

export async function list(_req: Request, res: Response) {
  const quotations = await quotationService.list()
  res.json({ success: true, data: { quotations } })
}

export async function getOne(req: Request, res: Response) {
  const quotation = await quotationService.getOne(parseId(req))
  res.json({ success: true, data: { quotation } })
}

export async function create(req: Request, res: Response) {
  const quotation = await quotationService.create(req.body, req.user!.id, extractDesignFile(req))
  res.status(201).json({ success: true, data: { quotation } })
}

export async function update(req: Request, res: Response) {
  const quotation = await quotationService.update(parseId(req), req.body, req.user!, extractDesignFile(req))
  res.json({ success: true, data: { quotation } })
}

export async function approve(req: Request, res: Response) {
  const quotation = await quotationService.approve(parseId(req), req.user!.id)
  res.json({ success: true, data: { quotation } })
}

export async function reject(req: Request, res: Response) {
  const quotation = await quotationService.reject(parseId(req), req.user!.id, req.body.reason)
  res.json({ success: true, data: { quotation } })
}

// 201 when this call created the invoice; 200 when it already existed (a retry / double click /
// concurrent duplicate), returning that same invoice instead of making a second one.
export async function confirmClientApproval(req: Request, res: Response) {
  const result = await proformaInvoiceService.confirmClientApproval(parseId(req), req.user!)
  res.status(result.created ? 201 : 200).json({ success: true, data: result })
}

export async function downloadPdf(req: Request, res: Response) {
  const quotation = await quotationService.getForPdf(parseId(req))
  const pdfBuffer = await renderQuotationPdf(quotation)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quotation.quotationNumber}.pdf"`)
  res.send(pdfBuffer)
}

export async function viewHtml(req: Request, res: Response) {
  const quotation = await quotationService.getForView(parseId(req))
  res.type('html').send(renderQuotationHtml(quotation))
}
