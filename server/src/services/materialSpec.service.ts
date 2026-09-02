import { ApiError } from '../middleware/errorHandler'
import * as materialSpecRepository from '../repositories/materialSpec.repository'
import type { MaterialSpecBody } from '../validations/materialSpec.validation'

export function list() {
  return materialSpecRepository.findAll()
}

export async function create(input: MaterialSpecBody) {
  return materialSpecRepository.create(input)
}

export async function update(id: number, input: MaterialSpecBody) {
  const existing = await materialSpecRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Material not found.')
  }
  return materialSpecRepository.update(id, input)
}

export async function remove(id: number) {
  const existing = await materialSpecRepository.findById(id)
  if (!existing) {
    throw new ApiError(404, 'Material not found.')
  }
  await materialSpecRepository.remove(id)
}
