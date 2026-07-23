import { api } from './client'

export type CalendarItemType = 'memo' | 'job_to_me' | 'job_by_me'

export interface CalendarItem {
  id: number
  type: CalendarItemType
  title: string
  dueDate: string
  other: string | null
}

interface CalendarResponse {
  success: true
  data: { byDate: Record<string, CalendarItem[]>; upcoming: CalendarItem[] }
}

export function getCalendar(year: number, month: number) {
  return api.get<CalendarResponse>('/task-calendar', { params: { year, month } }).then((r) => r.data.data)
}

export interface QuickAddMemoInput {
  title: string
  description?: string
  dueDate: string
}

export function quickAddMemo(input: QuickAddMemoInput) {
  return api.post('/task-calendar/memos', input)
}

export interface CreateOfficeTaskInput {
  title: string
  description?: string
  dueDate: string
  assignedToId: number
}

export function createOfficeTask(input: CreateOfficeTaskInput) {
  return api.post('/task-calendar/office-tasks', input)
}
