// Translated from product.php's php_action family. Image upload replaces move_uploaded_file()
// with Multer (see middleware/upload.ts); the legacy code's "../"-prefixed relative path bug in
// createProduct.php (fixed inconsistently later by editProductImage.php) isn't preserved — the new
// storage layout is inherently different, so there is no equivalent bug to carry forward.

import { ApiError } from '../middleware/errorHandler'
import * as productRepository from '../repositories/product.repository'
import * as brandRepository from '../repositories/brand.repository'
import * as categoryRepository from '../repositories/category.repository'
import type { ProductBody, UpdateProductBody } from '../validations/product.validation'

export function list() {
  return productRepository.findAllActive()
}

export async function getOne(id: number) {
  const product = await productRepository.findById(id)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  return product
}

// Mirrors the brand/category <select> options on the add/edit product forms.
export async function formOptions() {
  const [brands, categories] = await Promise.all([
    brandRepository.findAllAvailable(),
    categoryRepository.findAllAvailable(),
  ])
  return { brands, categories }
}

export async function create(input: ProductBody, imageUrl: string) {
  return productRepository.create({ ...input, imageUrl })
}

export async function update(id: number, input: UpdateProductBody) {
  const product = await productRepository.findById(id)
  if (!product || product.status === 'Deleted') {
    throw new ApiError(404, 'Product not found')
  }
  return productRepository.update(id, input)
}

export async function updateImage(id: number, imageUrl: string) {
  const product = await productRepository.findById(id)
  if (!product || product.status === 'Deleted') {
    throw new ApiError(404, 'Product not found')
  }
  return productRepository.updateImage(id, imageUrl)
}

export async function updateQuantity(id: number, quantity: number) {
  const product = await productRepository.findById(id)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  return productRepository.updateQuantity(id, quantity)
}

export async function remove(id: number) {
  const product = await productRepository.findById(id)
  if (!product || product.status === 'Deleted') {
    throw new ApiError(404, 'Product not found')
  }
  await productRepository.softDelete(id)
}
