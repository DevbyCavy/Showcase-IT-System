import type { Request, Response } from 'express'
import * as categoryService from '../services/category.service'
import { ApiError } from '../middleware/errorHandler'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid category id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const categories = await categoryService.list()
  res.json({ success: true, data: { categories } })
}

export async function getOne(req: Request, res: Response) {
  const category = await categoryService.getOne(parseId(req))
  res.json({ success: true, data: { category } })
}

export async function create(req: Request, res: Response) {
  const category = await categoryService.create(req.body)
  res.status(201).json({ success: true, data: { category } })
}

export async function update(req: Request, res: Response) {
  const category = await categoryService.update(parseId(req), req.body)
  res.json({ success: true, data: { category } })
}

export async function remove(req: Request, res: Response) {
  await categoryService.remove(parseId(req))
  res.json({ success: true })
}
