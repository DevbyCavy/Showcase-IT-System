// Translated from brand.php's php_action family — structurally identical to categories (see
// category.service.ts). editBrand.php had a real bug (`UPDATE brands` against a table actually
// named `brand`, so edits 500'd) — fixed here simply by using the correct Prisma model.

import { ApiError } from '../middleware/errorHandler'
import * as brandRepository from '../repositories/brand.repository'
import type { BrandBody } from '../validations/brand.validation'

export function list() {
  return brandRepository.findAllActive()
}

export async function create(input: BrandBody) {
  return brandRepository.create(input)
}

export async function update(id: number, input: BrandBody) {
  const brand = await brandRepository.findById(id)
  if (!brand || brand.status === 'Deleted') {
    throw new ApiError(404, 'Brand not found')
  }
  return brandRepository.update(id, input)
}

export async function remove(id: number) {
  const brand = await brandRepository.findById(id)
  if (!brand || brand.status === 'Deleted') {
    throw new ApiError(404, 'Brand not found')
  }
  await brandRepository.softDelete(id)
}

export async function getOne(id: number) {
  const brand = await brandRepository.findById(id)
  if (!brand) {
    throw new ApiError(404, 'Brand not found')
  }
  return brand
}
