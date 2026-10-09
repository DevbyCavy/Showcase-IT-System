import type { Request, Response } from 'express'
import * as invoiceService from '../services/proformaInvoice.service'
import { ApiError } from '../middleware/errorHandler'
import { invoiceListQuerySchema } from '../validations/proformaInvoice.validation'
import { renderInvoiceHtml, renderInvoicePdf, renderReceiptHtml, renderReceiptPdf } from '../utils/financeDocumentPdf'

function parseId(req: Request, label: string): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label} id`)
  }
  return id
}

export async function list(req: Request, res: Response) {
  const parsed = invoiceListQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join('; '))
  }
  const data = await invoiceService.list(parsed.data)
  res.json({ success: true, data })
}

export async function getOne(req: Request, res: Response) {
  const invoice = await invoiceService.getOne(parseId(req, 'invoice'))
  res.json({ success: true, data: { invoice } })
}

export async function recordPayment(req: Request, res: Response) {
  const result = await invoiceService.recordPayment(parseId(req, 'invoice'), req.body, req.user!)
  res.status(result.duplicate ? 200 : 201).json({ success: true, data: result })
}

export async function downloadPdf(req: Request, res: Response) {
  const invoice = await invoiceService.getForPdf(parseId(req, 'invoice'), req.user!)
  const pdfBuffer = await renderInvoicePdf(invoice)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="Proforma_${invoice.invoiceNumber}.pdf"`)
  res.send(pdfBuffer)
}

export async function viewHtml(req: Request, res: Response) {
  const invoice = await invoiceService.getForPdf(parseId(req, 'invoice'), req.user!)
  res.type('html').send(renderInvoiceHtml(invoice))
}

export async function downloadReceipt(req: Request, res: Response) {
  const payment = await invoiceService.getPaymentForReceipt(parseId(req, 'payment'), req.user!)
  const pdfBuffer = await renderReceiptPdf(payment)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="Receipt_${payment.receiptNumber}.pdf"`)
  res.send(pdfBuffer)
}

export async function viewReceiptHtml(req: Request, res: Response) {
  const payment = await invoiceService.getPaymentForReceipt(parseId(req, 'payment'), req.user!)
  res.type('html').send(renderReceiptHtml(payment))
}
