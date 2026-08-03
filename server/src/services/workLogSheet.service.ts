// Translated from includes/workLogSheet.php + startShift.php/startTask.php/stopTask.php/
// toggleEveningShift.php/getWeekLog.php (feature/work-log-sheet, never merged to main — see
// MIGRATION_PLAN.md §10). The legacy include rendered a pre-computed HTML timeline fragment for
// the week view; here the endpoint returns raw shift/task data instead and the React widget does
// the rendering — the fixed shift schedule and break windows are still computed once, server-side,
// as the single source of truth instead of being duplicated in every consuming template.

import { ApiError } from '../middleware/errorHandler'
import * as repo from '../repositories/workLogSheet.repository'
import type { StartTaskBody } from '../validations/workLogSheet.validation'
import { addDays, isSameDate, mondayOfWeek, todayDateOnly } from '../utils/workDate'
import type { WorkShift, WorkTask } from '#prisma-client'

export const SHIFT_START = '08:30'
export const SHIFT_END = '16:30'
export const BREAKS = [
  { start: '08:30', end: '09:00', label: 'Tea Break' },
  { start: '13:00', end: '13:40', label: 'Lunch' },
] as const

const schedule = { shiftStart: SHIFT_START, shiftEnd: SHIFT_END, breaks: BREAKS }

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

function nowHHMM(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Same fixed schedule check as startTask.php: blocks starting a NEW task during a break window
// (an already-running task is unaffected).
function activeBreak() {
  const now = nowHHMM()
  return BREAKS.find((b) => now >= b.start && now < b.end) ?? null
}

function toPublicTask(task: WorkTask) {
  return {
    id: task.id,
    taskName: task.taskName,
    taskNotes: task.taskNotes,
    startTime: task.startTime,
    endTime: task.endTime,
    status: task.status,
  }
}

function toPublicShift(shift: WorkShift & { tasks: WorkTask[] }) {
  return {
    id: shift.id,
    shiftDate: shift.shiftDate,
    loginTime: shift.loginTime,
    eveningShift: shift.eveningShift,
    tasks: shift.tasks.map(toPublicTask),
  }
}

export async function getToday(userId: number) {
  const shift = await repo.findShiftByUserAndDate(userId, todayDateOnly())
  return { schedule, shift: shift ? toPublicShift(shift) : null }
}

// Mirrors startShift.php: idempotent, one shift row per user per day.
export async function startShift(userId: number) {
  const today = todayDateOnly()
  const existing = await repo.findShiftByUserAndDate(userId, today)
  const shift = existing ?? (await repo.createShift(userId, today))
  return { schedule, shift: toPublicShift(shift) }
}

export async function startTask(userId: number, input: StartTaskBody) {
  const onBreak = activeBreak()
  if (onBreak) {
    throw new ApiError(400, `Cannot start a task during ${onBreak.label}.`)
  }

  const shift = await repo.findShiftByUserAndDate(userId, todayDateOnly())
  if (!shift) {
    throw new ApiError(400, 'Log in first.')
  }

  const running = await repo.findRunningTask(userId)
  if (running) {
    throw new ApiError(400, 'Finish your current task first.')
  }

  const task = await repo.createTask(shift.id, userId, input.taskName, input.taskNotes)
  return toPublicTask(task)
}

export async function stopTask(userId: number, taskId: number) {
  const stopped = await repo.stopTask(taskId, userId)
  if (!stopped) {
    throw new ApiError(400, 'Could not stop — not found or already stopped.')
  }
  const shift = await repo.findShiftByUserAndDate(userId, todayDateOnly())
  const task = shift?.tasks.find((t) => t.id === taskId)
  if (!task) {
    throw new ApiError(404, 'Task not found.')
  }
  return toPublicTask(task)
}

export async function toggleEveningShift(userId: number) {
  const today = todayDateOnly()
  const ok = await repo.setEveningShift(userId, today)
  if (!ok) {
    throw new ApiError(400, 'Log in first.')
  }
  const shift = await repo.findShiftByUserAndDate(userId, today)
  return toPublicShift(shift!)
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Mirrors getWeekLog.php: Monday..Saturday of the current week, plus a single axis end shared
// across every day in the view (starting at 16:30, stretched to cover the latest task/shift end,
// then rounded up to the next full hour).
export async function getWeekLog(userId: number) {
  const today = todayDateOnly()
  const monday = mondayOfWeek(today)
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(monday, i))
  const weekEnd = weekDates[5]

  const shifts = await repo.findShiftsForWeek(userId, monday, weekEnd)
  const shiftsByDate = new Map(shifts.map((s) => [s.shiftDate.getTime(), s]))

  let axisEndMin = hhmmToMin(SHIFT_END)
  const now = new Date()

  for (const shift of shifts) {
    const dateIsToday = isSameDate(shift.shiftDate, today)
    for (const task of shift.tasks) {
      const endRef = task.endTime ?? (dateIsToday ? now : null)
      if (endRef) {
        axisEndMin = Math.max(axisEndMin, minutesOfDay(endRef))
      }
    }
    if (shift.logoutTime) {
      axisEndMin = Math.max(axisEndMin, minutesOfDay(shift.logoutTime))
    }
  }
  axisEndMin = Math.ceil(axisEndMin / 60) * 60

  const days = weekDates.map((date) => {
    const shift = shiftsByDate.get(date.getTime())
    return {
      date: date.toISOString().slice(0, 10),
      dayLabel: DAY_LABELS[date.getUTCDay()],
      isToday: isSameDate(date, today),
      shift: shift
        ? { loginTime: shift.loginTime, eveningShift: shift.eveningShift, tasks: shift.tasks.map(toPublicTask) }
        : null,
    }
  })

  return { schedule, axisStartMin: hhmmToMin(SHIFT_START), axisEndMin, days }
}
