import type { Request, Response } from 'express'
import * as productService from '../services/product.service'
import { ApiError } from '../middleware/errorHandler'
import { publicUploadPath } from '../middleware/upload'

function parseId(req: Request): number {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid product id')
  }
  return id
}

export async function list(_req: Request, res: Response) {
  const products = await productService.list()
  res.json({ success: true, data: { products } })
}

export async function getOne(req: Request, res: Response) {
  const product = await productService.getOne(parseId(req))
  res.json({ success: true, data: { product } })
}

export async function formOptions(_req: Request, res: Response) {
  const options = await productService.formOptions()
  res.json({ success: true, data: options })
}

export async function create(req: Request, res: Response) {
  if (!req.file) {
    throw new ApiError(400, 'Product Image field is required')
  }
  const imageUrl = publicUploadPath('products', req.file.filename)
  const product = await productService.create(req.body, imageUrl)
  res.status(201).json({ success: true, data: { product } })
}

export async function update(req: Request, res: Response) {
  const product = await productService.update(parseId(req), req.body)
  res.json({ success: true, data: { product } })
}

export async function updateImage(req: Request, res: Response) {
  if (!req.file) {
    throw new ApiError(400, 'No image uploaded or upload error.')
  }
  const imageUrl = publicUploadPath('products', req.file.filename)
  const product = await productService.updateImage(parseId(req), imageUrl)
  res.json({ success: true, data: { product }, newImageUrl: imageUrl })
}

export async function updateQuantity(req: Request, res: Response) {
  const product = await productService.updateQuantity(parseId(req), req.body.quantity)
  res.json({ success: true, data: { product } })
}

export async function remove(req: Request, res: Response) {
  await productService.remove(parseId(req))
  res.json({ success: true })
}
