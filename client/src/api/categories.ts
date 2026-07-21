import { api } from './client'

export interface Category {
  id: number
  name: string
  isActive: boolean
  status: 'Active' | 'Deleted'
}

interface CategoryResponse {
  success: true
  data: { category: Category }
}

interface CategoryListResponse {
  success: true
  data: { categories: Category[] }
}

export function list() {
  return api.get<CategoryListResponse>('/categories').then((r) => r.data.data.categories)
}

export interface CategoryInput {
  name: string
  isActive: boolean
}

export function create(input: CategoryInput) {
  return api.post<CategoryResponse>('/categories', input).then((r) => r.data.data.category)
}

export function update(id: number, input: CategoryInput) {
  return api.put<CategoryResponse>(`/categories/${id}`, input).then((r) => r.data.data.category)
}

export function remove(id: number) {
  return api.delete(`/categories/${id}`)
}
