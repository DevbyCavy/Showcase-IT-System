import { api } from './client'
import type { Product } from './products'

interface AvailableProductsResponse {
  success: true
  data: { products: Product[] }
}

export function listAvailableProducts() {
  return api.get<AvailableProductsResponse>('/inventory/products').then((r) => r.data.data.products)
}

export interface IssuedTool {
  id: number
  productId: number
  dateOfCollection: string
  collectorId: number | null
  collectorName: string
  toolName: string
  quantityIssued: number
  jobName: string
  isReturnable: boolean
  dateOfReturn: string | null
  createdAt: string
}

interface IssuedToolsResponse {
  success: true
  data: { issuedTools: IssuedTool[] }
}

export function listIssuedTools() {
  return api.get<IssuedToolsResponse>('/inventory/issued-tools').then((r) => r.data.data.issuedTools)
}

export interface IssueProductInput {
  productId: number
  dateOfCollection: string
  collectorId: number
  toolName: string
  quantityIssued: number
  jobName: string
  isReturnable: boolean
  dateOfReturn?: string
}

interface IssueProductResponse {
  success: true
  data: { issuedTool: IssuedTool }
}

export function issueProduct(input: IssueProductInput) {
  return api.post<IssueProductResponse>('/inventory/issued-tools', input).then((r) => r.data.data.issuedTool)
}

interface DueRemindersResponse {
  success: true
  data: { asCollector: IssuedTool[]; asStores: IssuedTool[] }
}

export function getDueReminders() {
  return api.get<DueRemindersResponse>('/inventory/due-reminders').then((r) => r.data.data)
}

export function acknowledgeAsCollector(ids: number[]) {
  return api.post('/inventory/acknowledge/collector', { ids })
}

export function acknowledgeAsStores(ids: number[]) {
  return api.post('/inventory/acknowledge/stores', { ids })
}
