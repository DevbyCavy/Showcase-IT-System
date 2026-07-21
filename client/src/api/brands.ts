import { api } from './client'

export interface Brand {
  id: number
  name: string
  isActive: boolean
  status: 'Active' | 'Deleted'
}

interface BrandResponse {
  success: true
  data: { brand: Brand }
}

interface BrandListResponse {
  success: true
  data: { brands: Brand[] }
}

export function list() {
  return api.get<BrandListResponse>('/brands').then((r) => r.data.data.brands)
}

export interface BrandInput {
  name: string
  isActive: boolean
}

export function create(input: BrandInput) {
  return api.post<BrandResponse>('/brands', input).then((r) => r.data.data.brand)
}

export function update(id: number, input: BrandInput) {
  return api.put<BrandResponse>(`/brands/${id}`, input).then((r) => r.data.data.brand)
}

export function remove(id: number) {
  return api.delete(`/brands/${id}`)
}
