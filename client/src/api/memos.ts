import { api } from './client'

export type MemoStatus = 'Pending' | 'Done'

export interface Memo {
  id: number
  title: string
  description: string | null
  dueDate: string
  status: MemoStatus
  createdAt: string
}

interface MemoListResponse {
  success: true
  data: { memos: Memo[] }
}

interface MemoResponse {
  success: true
  data: { memo: Memo }
}

export function list() {
  return api.get<MemoListResponse>('/memos').then((r) => r.data.data.memos)
}

export interface MemoInput {
  title: string
  description?: string
  dueDate: string
}

export function create(input: MemoInput) {
  return api.post<MemoResponse>('/memos', input).then((r) => r.data.data.memo)
}

export function markDone(id: number) {
  return api.put(`/memos/${id}/done`)
}

export function remove(id: number) {
  return api.delete(`/memos/${id}`)
}

export function getDueReminders() {
  return api.get<MemoListResponse>('/memos/due-reminders').then((r) => r.data.data.memos)
}

export function acknowledge(ids: number[]) {
  return api.post('/memos/acknowledge', { ids })
}
