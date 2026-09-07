// .xlsx export for the AI Takeoff / BOQ Generator — three sheets per design doc §6: the full
// reviewed item list, a by-category subtotal, and an assumptions/review-notes sheet listing every
// non-extracted (predicted/inferred) row so a recipient who wasn't the one reviewing it in-app
// still sees exactly what was guessed.

import ExcelJS from 'exceljs'
import type { TakeoffDesign, TakeoffItem } from '#prisma-client'

type DesignWithItems = TakeoffDesign & { items: TakeoffItem[]; project: { name: string; clientName: string | null } }

const AMBER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8B4' } }

const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } }
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7B00' } }

function num(value: unknown): number | null {
  return value == null ? null : Number(value)
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
  })
}

export async function renderTakeoffXlsx(design: DesignWithItems): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ShowcaseIT — AI Takeoff'
  workbook.created = new Date()

  // Sheet 1 — BOQ Summary
  const summarySheet = workbook.addWorksheet('BOQ Summary')
  summarySheet.columns = [
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Category', key: 'category', width: 14 },
    { header: 'Material', key: 'material', width: 16 },
    { header: 'W (mm)', key: 'widthMm', width: 10 },
    { header: 'H (mm)', key: 'heightMm', width: 10 },
    { header: 'L (mm)', key: 'lengthMm', width: 10 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Source', key: 'source', width: 12 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Notes', key: 'notes', width: 40 },
  ]
  styleHeaderRow(summarySheet.getRow(1))

  for (const item of design.items) {
    const row = summarySheet.addRow({
      description: item.description,
      category: item.category,
      material: item.material ?? '',
      widthMm: num(item.widthMm),
      heightMm: num(item.heightMm),
      lengthMm: num(item.lengthMm),
      unit: item.unit,
      quantity: num(item.quantity),
      source: item.source,
      confidence: item.confidence,
      notes: item.notes ?? '',
    })
    if (item.source !== 'Extracted') {
      row.eachCell((cell) => (cell.fill = AMBER_FILL))
    }
  }

  // Sheet 2 — By Category
  const categorySheet = workbook.addWorksheet('By Category')
  categorySheet.columns = [
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Line Items', key: 'lineItems', width: 12 },
    { header: 'Total Quantity', key: 'totalQuantity', width: 16 },
  ]
  styleHeaderRow(categorySheet.getRow(1))

  const byCategory = new Map<string, { lineItems: number; totalQuantity: number }>()
  for (const item of design.items) {
    const entry = byCategory.get(item.category) ?? { lineItems: 0, totalQuantity: 0 }
    entry.lineItems += 1
    entry.totalQuantity += Number(item.quantity)
    byCategory.set(item.category, entry)
  }
  for (const [category, entry] of byCategory) {
    categorySheet.addRow({ category, lineItems: entry.lineItems, totalQuantity: entry.totalQuantity })
  }

  // Sheet 3 — Assumptions & Review Notes
  const notesSheet = workbook.addWorksheet('Assumptions & Review Notes')
  notesSheet.columns = [
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Source', key: 'source', width: 12 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Notes', key: 'notes', width: 60 },
  ]
  styleHeaderRow(notesSheet.getRow(1))

  for (const item of design.items.filter((i) => i.source !== 'Extracted')) {
    const row = notesSheet.addRow({
      description: item.description,
      source: item.source,
      confidence: item.confidence,
      notes: item.notes ?? '',
    })
    row.eachCell((cell) => (cell.fill = AMBER_FILL))
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
