// Translated from categories.php's php_action family. `categories_status` is a soft-delete flag
// (Active/Deleted, see schema.prisma) separate from `categories_active` (the "Available" business
// flag, here `isActive`) — the legacy form confusingly names the isActive field "Status", but it
// never touches the soft-delete column except on create (always Active) and remove (Deleted).

import { ApiError } from '../middleware/errorHandler'
import * as categoryRepository from '../repositories/category.repository'
import type { CategoryBody } from '../validations/category.validation'

export function list() {
  return categoryRepository.findAllActive()
}

export async function create(input: CategoryBody) {
  return categoryRepository.create(input)
}

export async function update(id: number, input: CategoryBody) {
  const category = await categoryRepository.findById(id)
  if (!category || category.status === 'Deleted') {
    throw new ApiError(404, 'Category not found')
  }
  return categoryRepository.update(id, input)
}

export async function remove(id: number) {
  const category = await categoryRepository.findById(id)
  if (!category || category.status === 'Deleted') {
    throw new ApiError(404, 'Category not found')
  }
  await categoryRepository.softDelete(id)
}

export async function getOne(id: number) {
  const category = await categoryRepository.findById(id)
  if (!category) {
    throw new ApiError(404, 'Category not found')
  }
  return category
}
