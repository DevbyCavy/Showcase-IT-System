import { api } from './client'

export type OrderStatus = 'New' | 'Assigned' | 'OnGoing' | 'Completed'

export interface Order {
  id: number
  orderNumber: string
  orderName: string
  description: string | null
  location: string
  deadlineDatetime: string | null
  boqFile: string | null
  artworkFile: string | null
  status: OrderStatus
  ongoingSince: string | null
  createdAt: string
  assignedUsers: { id: number; name: string; surname: string }[]
}

interface OrderResponse {
  success: true
  data: { order: Order }
}

interface OrderListResponse {
  success: true
  data: { orders: Order[] }
}

export function list() {
  return api.get<OrderListResponse>('/orders').then((r) => r.data.data.orders)
}

export interface OrderFormInput {
  orderName: string
  description?: string
  location: string
  deadlineDatetime: string
  assignedUserIds: number[]
  boqFile?: File
  artworkFile?: File
}

function toFormData(input: OrderFormInput) {
  const formData = new FormData()
  formData.append('orderName', input.orderName)
  if (input.description) formData.append('description', input.description)
  formData.append('location', input.location)
  formData.append('deadlineDatetime', input.deadlineDatetime)
  input.assignedUserIds.forEach((id) => formData.append('assignedUserIds', String(id)))
  if (input.boqFile) formData.append('boqFile', input.boqFile)
  if (input.artworkFile) formData.append('artworkFile', input.artworkFile)
  return formData
}

export function create(input: OrderFormInput) {
  return api.post<OrderResponse>('/orders', toFormData(input)).then((r) => r.data.data.order)
}

export function update(id: number, input: OrderFormInput) {
  return api.put<OrderResponse>(`/orders/${id}`, toFormData(input)).then((r) => r.data.data.order)
}

export function updateStatus(id: number, status: OrderStatus) {
  return api.put<OrderResponse>(`/orders/${id}/status`, { status }).then((r) => r.data.data.order)
}
