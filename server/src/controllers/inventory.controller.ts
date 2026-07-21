import type { Request, Response } from 'express'
import * as inventoryService from '../services/inventory.service'

export async function listAvailableProducts(_req: Request, res: Response) {
  const products = await inventoryService.listAvailableProducts()
  res.json({ success: true, data: { products } })
}

export async function listIssuedTools(_req: Request, res: Response) {
  const issuedTools = await inventoryService.listIssuedTools()
  res.json({ success: true, data: { issuedTools } })
}

export async function issueProduct(req: Request, res: Response) {
  const issuedTool = await inventoryService.issueProduct(req.body)
  res.status(201).json({ success: true, data: { issuedTool } })
}
