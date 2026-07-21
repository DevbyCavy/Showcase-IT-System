import { api } from './client'

export type WorkTaskStatus = 'Running' | 'Completed'

export interface WorkTask {
  id: number
  taskName: string
  taskNotes: string | null
  startTime: string
  endTime: string | null
  status: WorkTaskStatus
}

export interface WorkShift {
  id: number
  shiftDate: string
  loginTime: string
  eveningShift: boolean
  tasks: WorkTask[]
}

export interface BreakWindow {
  start: string
  end: string
  label: string
}

export interface Schedule {
  shiftStart: string
  shiftEnd: string
  breaks: BreakWindow[]
}

interface TodayResponse {
  success: true
  data: { schedule: Schedule; shift: WorkShift | null }
}

interface TaskResponse {
  success: true
  data: { task: WorkTask }
}

interface ShiftResponse {
  success: true
  data: { schedule: Schedule; shift: WorkShift }
}

interface ToggleEveningShiftResponse {
  success: true
  data: { shift: WorkShift }
}

export interface WeekDay {
  date: string
  dayLabel: string
  isToday: boolean
  shift: { loginTime: string; eveningShift: boolean; tasks: WorkTask[] } | null
}

interface WeekLogResponse {
  success: true
  data: { schedule: Schedule; axisStartMin: number; axisEndMin: number; days: WeekDay[] }
}

export function getToday() {
  return api.get<TodayResponse>('/work-log-sheet/today').then((r) => r.data.data)
}

export function startShift() {
  return api.post<ShiftResponse>('/work-log-sheet/shift/start').then((r) => r.data.data)
}

export function startTask(input: { taskName: string; taskNotes?: string }) {
  return api.post<TaskResponse>('/work-log-sheet/tasks', input).then((r) => r.data.data.task)
}

export function stopTask(taskId: number) {
  return api.post<TaskResponse>(`/work-log-sheet/tasks/${taskId}/stop`).then((r) => r.data.data.task)
}

export function toggleEveningShift() {
  return api.post<ToggleEveningShiftResponse>('/work-log-sheet/evening-shift').then((r) => r.data.data.shift)
}

export function getWeekLog() {
  return api.get<WeekLogResponse>('/work-log-sheet/week').then((r) => r.data.data)
}
