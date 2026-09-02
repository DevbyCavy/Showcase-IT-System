import { api } from './client'

export interface MaterialSpec {
  id: number
  name: string
  unit: string
  standardSheetWmm: string | null
  standardSheetHmm: string | null
  typicalThicknessMm: number[]
  standardLengthsMm: number[]
  wasteFactor: string
  unitCost: string | null
}

export interface MaterialSpecInput {
  name: string
  unit: string
  standardSheetWmm?: number | null
  standardSheetHmm?: number | null
  typicalThicknessMm: number[]
  standardLengthsMm: number[]
  wasteFactor: number
  unitCost?: number | null
}

interface MaterialSpecListResponse {
  success: true
  data: { materials: MaterialSpec[] }
}

interface MaterialSpecResponse {
  success: true
  data: { material: MaterialSpec }
}

export function list() {
  return api.get<MaterialSpecListResponse>('/material-specs').then((r) => r.data.data.materials)
}

export function create(input: MaterialSpecInput) {
  return api.post<MaterialSpecResponse>('/material-specs', input).then((r) => r.data.data.material)
}

export function update(id: number, input: MaterialSpecInput) {
  return api.put<MaterialSpecResponse>(`/material-specs/${id}`, input).then((r) => r.data.data.material)
}

export function remove(id: number) {
  return api.delete(`/material-specs/${id}`)
}
