// Translated from getTaskCalendar.php + quickAddMemo.php + createOfficeTask.php (scoped from
// feature/office-task-calendar, never merged to main — see MIGRATION_PLAN.md §10). Memo is a
// lightweight personal to-do; OfficeTask is the actual "office task management" entity (assign a
// job to any user, any department).

import { ApiError } from '../middleware/errorHandler'
import * as memoRepository from '../repositories/memo.repository'
import * as officeTaskRepository from '../repositories/officeTask.repository'
import * as userRepository from '../repositories/user.repository'
import type { CreateOfficeTaskBody, QuickAddMemoBody } from '../validations/taskCalendar.validation'

type CalendarItemType = 'memo' | 'job_to_me' | 'job_by_me'

interface CalendarItem {
  id: number
  type: CalendarItemType
  title: string
  dueDate: string
  other: string | null
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function getCalendar(userId: number, year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 0))

  const [memos, tasksToMe, tasksByMe] = await Promise.all([
    memoRepository.findForUserInRange(userId, monthStart, monthEnd),
    officeTaskRepository.findAssignedToInRange(userId, monthStart, monthEnd),
    officeTaskRepository.findAssignedByInRange(userId, monthStart, monthEnd),
  ])

  const items: CalendarItem[] = [
    ...memos.map((m) => ({ id: m.id, type: 'memo' as const, title: m.title, dueDate: dateKey(m.dueDate), other: null })),
    ...tasksToMe.map((t) => ({
      id: t.id,
      type: 'job_to_me' as const,
      title: t.title,
      dueDate: dateKey(t.dueDate),
      other: t.assignedBy ? `${t.assignedBy.name} ${t.assignedBy.surname}`.trim() : null,
    })),
    ...tasksByMe.map((t) => ({
      id: t.id,
      type: 'job_by_me' as const,
      title: t.title,
      dueDate: dateKey(t.dueDate),
      other: t.assignedTo ? `${t.assignedTo.name} ${t.assignedTo.surname}`.trim() : null,
    })),
  ]

  const byDate: Record<string, CalendarItem[]> = {}
  for (const item of items) {
    ;(byDate[item.dueDate] ??= []).push(item)
  }

  const today = dateKey(new Date())
  const upcoming = items
    .filter((i) => i.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)

  return { byDate, upcoming }
}

export async function quickAddMemo(userId: number, input: QuickAddMemoBody) {
  return memoRepository.create({
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    createdById: userId,
  })
}

export async function createOfficeTask(userId: number, input: CreateOfficeTaskBody) {
  const assignee = await userRepository.findById(input.assignedToId)
  if (!assignee) {
    throw new ApiError(400, 'Selected assignee is invalid.')
  }
  return officeTaskRepository.create({
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    assignedById: userId,
    assignedToId: input.assignedToId,
  })
}
