import { prisma } from '../config/prisma'

const tasksOrder = { startTime: 'asc' as const }

export function findShiftByUserAndDate(userId: number, shiftDate: Date) {
  return prisma.workShift.findUnique({
    where: { userId_shiftDate: { userId, shiftDate } },
    include: { tasks: { orderBy: tasksOrder } },
  })
}

export function createShift(userId: number, shiftDate: Date) {
  return prisma.workShift.create({
    data: { userId, shiftDate, loginTime: new Date() },
    include: { tasks: { orderBy: tasksOrder } },
  })
}

export function findRunningTask(userId: number) {
  return prisma.workTask.findFirst({ where: { userId, status: 'Running' } })
}

export function createTask(shiftId: number, userId: number, taskName: string, taskNotes?: string) {
  return prisma.workTask.create({
    data: { shiftId, userId, taskName, taskNotes, startTime: new Date(), status: 'Running' },
  })
}

// Mirrors stopTask.php's `WHERE task_id = ? AND user_id = ? AND status = 'Running'` guard —
// atomic, so a task can never be stopped twice or by another user.
export async function stopTask(taskId: number, userId: number) {
  const result = await prisma.workTask.updateMany({
    where: { id: taskId, userId, status: 'Running' },
    data: { endTime: new Date(), status: 'Completed' },
  })
  return result.count > 0
}

// Unlike MySQL's affected_rows (0 if the value was already 1), Prisma's updateMany count reflects
// rows matching the WHERE clause regardless of whether the SET changes anything — so re-toggling
// an already-evening shift now correctly reports success instead of legacy's "Log in first." bug.
export async function setEveningShift(userId: number, shiftDate: Date) {
  const result = await prisma.workShift.updateMany({
    where: { userId, shiftDate },
    data: { eveningShift: true },
  })
  return result.count > 0
}

export function findShiftsForWeek(userId: number, weekStart: Date, weekEnd: Date) {
  return prisma.workShift.findMany({
    where: { userId, shiftDate: { gte: weekStart, lte: weekEnd } },
    include: { tasks: { orderBy: tasksOrder } },
  })
}
