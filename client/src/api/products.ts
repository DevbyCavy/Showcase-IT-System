import { api } from './client'
import type { Brand } from './brands'
import type { Category } from './categories'

export interface Product {
  id: number
  name: string
  code: string
  imageUrl: string
  brandId: number
  categoryId: number
  quantity: number
  rate: string
  isActive: boolean
  status: 'Active' | 'Deleted'
  brand: Brand
  category: Category
}

export interface FulfilledShortfall {
  requisitionId: number
  reqNumber: string
  amountFulfilled: number
  fullyFulfilled: boolean
}

interface ProductResponse {
  success: true
  data: { product: Product }
}

// Only /quantity and the full edit PUT can raise stock and therefore fulfill shortfalls — see
// MIGRATION_PLAN.md §30.
interface ProductUpdateResponse {
  success: true
  data: { product: Product; fulfilled: FulfilledShortfall[] }
}

interface ProductListResponse {
  success: true
  data: { products: Product[] }
}

interface FormOptionsResponse {
  success: true
  data: { brands: Brand[]; categories: Category[] }
}

export function list() {
  return api.get<ProductListResponse>('/products').then((r) => r.data.data.products)
}

export function formOptions() {
  return api.get<FormOptionsResponse>('/products/form-options').then((r) => r.data.data)
}

export interface CreateProductInput {
  image: File
  name: string
  quantity: string
  rate: string
  brandId: string
  categoryId: string
  isActive: boolean
}

export function create(input: CreateProductInput) {
  const formData = new FormData()
  formData.append('productImage', input.image)
  formData.append('name', input.name)
  formData.append('quantity', input.quantity)
  formData.append('rate', input.rate)
  formData.append('brandId', input.brandId)
  formData.append('categoryId', input.categoryId)
  formData.append('isActive', input.isActive ? '1' : '2')
  return api.post<ProductResponse>('/products', formData).then((r) => r.data.data.product)
}

export interface UpdateProductInput {
  name: string
  quantity: number
  rate: number
  brandId: number
  categoryId: number
  isActive: boolean
}

export function update(id: number, input: UpdateProductInput) {
  return api.put<ProductUpdateResponse>(`/products/${id}`, input).then((r) => r.data.data)
}

export function updateImage(id: number, image: File) {
  const formData = new FormData()
  formData.append('productImage', image)
  return api.put<ProductResponse>(`/products/${id}/image`, formData).then((r) => r.data.data.product)
}

export function updateQuantity(id: number, quantity: number) {
  return api.put<ProductUpdateResponse>(`/products/${id}/quantity`, { quantity }).then((r) => r.data.data)
}

export function remove(id: number) {
  return api.delete(`/products/${id}`)
}
