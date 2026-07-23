import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Play, Square, Moon, CalendarRange, LogIn, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as workLogApi from '@/api/workLogSheet'
import type { Schedule, WeekDay } from '@/api/workLogSheet'

// Translated from includes/workLogSheet.php's JS `tick()` loop (feature/work-log-sheet, never
// merged to main — see MIGRATION_PLAN.md §10). Legacy re-rendered every 15s via setInterval; here
// the same cadence just bumps a `now` state so the timeline/adherence/break-guard recompute.
function hhmmToMin(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
function minToHHMM(min: number) {
  min = Math.max(0, Math.round(min))
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}
function pctMin(min: number, startMin: number, endMin: number) {
  const span = Math.max(1, endMin - startMin)
  return Math.max(0, Math.min(100, ((min - startMin) / span) * 100))
}
function todayAt(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}
function extractError(err: unknown, fallback: string) {
  return isAxiosError(err) ? ((err.response?.data as { error?: string } | undefined)?.error ?? fallback) : fallback
}

type TodayData = Awaited<ReturnType<typeof workLogApi.getToday>>

interface TimelineTask {
  taskName: string
  startMin: number
  endMin: number
  running: boolean
}

// A single timeline row (ticks + break bands + task bars), shared by the live "today" strip and
// the static week view — both just feed it different [axisStartMin, axisEndMin, tasks].
function TimelineRow({
  axisStartMin,
  axisEndMin,
  breaks,
  tasks,
}: {
  axisStartMin: number
  axisEndMin: number
  breaks: Schedule['breaks']
  tasks: TimelineTask[]
}) {
  const ticks: number[] = [axisStartMin]
  let t = (Math.floor(axisStartMin / 60) + 1) * 60
  while (t < axisEndMin) {
    ticks.push(t)
    t += 60
  }
  ticks.push(axisEndMin)

  return (
    <div>
      <div className="relative mb-0.5 h-5 border-b">
        {ticks.map((tm) => (
          <span
            key={tm}
            className="text-muted-foreground absolute -translate-x-1/2 whitespace-nowrap text-[0.7rem]"
            style={{ left: `${pctMin(tm, axisStartMin, axisEndMin)}%` }}
          >
            {minToHHMM(tm)}
          </span>
        ))}
      </div>
      <div className="bg-secondary relative my-2.5 h-14 overflow-hidden rounded-lg">
        {breaks.map((b) => {
          const left = pctMin(hhmmToMin(b.start), axisStartMin, axisEndMin)
          const width = Math.max(0, pctMin(hhmmToMin(b.end), axisStartMin, axisEndMin) - left)
          return (
            <div
              key={b.label}
              className="text-muted-foreground absolute top-0 bottom-0 flex items-center justify-center px-1 text-center text-[0.68rem] font-semibold"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundImage: 'repeating-linear-gradient(45deg, #ececec, #ececec 6px, #e0e0e0 6px, #e0e0e0 12px)',
              }}
            >
              {b.label}
            </div>
          )
        })}
        {tasks.map((tk, i) => {
          const left = pctMin(tk.startMin, axisStartMin, axisEndMin)
          const width = Math.max(0.6, pctMin(tk.endMin, axisStartMin, axisEndMin) - left)
          return (
            <div
              key={i}
              title={tk.taskName}
              className={`absolute top-1.5 bottom-1.5 flex items-center overflow-hidden rounded-md px-2 text-xs font-semibold whitespace-nowrap text-white ${
                tk.running ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {tk.taskName}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekDayRow({
  day,
  axisStartMin,
  axisEndMin,
  breaks,
}: {
  day: WeekDay
  axisStartMin: number
  axisEndMin: number
  breaks: Schedule['breaks']
}) {
  const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  const tasks: TimelineTask[] = (day.shift?.tasks ?? []).map((t) => {
    const s = new Date(t.startTime)
    const e = t.endTime ? new Date(t.endTime) : day.isToday ? new Date() : s
    return {
      taskName: t.taskName,
      startMin: s.getHours() * 60 + s.getMinutes(),
      endMin: e.getHours() * 60 + e.getMinutes(),
      running: t.status === 'Running',
    }
  })

  return (
    <div className="flex gap-3">
      <div className="w-20 shrink-0 text-sm leading-tight font-bold">
        {day.dayLabel}{' '}
        {day.isToday && <span className="rounded bg-amber-400 px-1 py-0.5 text-[0.62rem] text-black">Today</span>}
        <br />
        <span className="text-muted-foreground text-xs font-medium">{dateLabel}</span>
      </div>
      <div className="min-w-0 flex-1">
        {!day.shift ? (
          <div className="bg-secondary text-muted-foreground flex h-14 items-center justify-center rounded-lg text-sm">
            No shift logged
          </div>
        ) : (
          <TimelineRow axisStartMin={axisStartMin} axisEndMin={axisEndMin} breaks={breaks} tasks={tasks} />
        )}
      </div>
    </div>
  )
}

function WeekLogModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['workLogSheet', 'week'], queryFn: workLogApi.getWeekLog })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarRange className="h-5 w-5" /> This Week's Work Log
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading && <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>}
        {isError && <p className="text-destructive py-8 text-center text-sm">Could not load week log.</p>}

        {data && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <TimelineRow axisStartMin={data.axisStartMin} axisEndMin={data.axisEndMin} breaks={data.schedule.breaks} tasks={[]} />
              </div>
            </div>
            {data.days.map((day) => (
              <WeekDayRow key={day.date} day={day} axisStartMin={data.axisStartMin} axisEndMin={data.axisEndMin} breaks={data.schedule.breaks} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Self-contained Work Log Sheet widget — embed below the Orders section on any dashboard, for any
// logged-in role, exactly like includes/workLogSheet.php's placement convention.
export function WorkLogSheet() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['workLogSheet', 'today'], queryFn: workLogApi.getToday })
  const [now, setNow] = useState(() => new Date())
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [weekModalOpen, setWeekModalOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskNotes, setTaskNotes] = useState('')
  const [showExtra, setShowExtra] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])

  const startShiftMutation = useMutation({
    mutationFn: workLogApi.startShift,
    onSuccess: (result) => queryClient.setQueryData<TodayData>(['workLogSheet', 'today'], result),
  })

  const startTaskMutation = useMutation({
    mutationFn: workLogApi.startTask,
    onSuccess: (task) => {
      queryClient.setQueryData<TodayData>(['workLogSheet', 'today'], (prev) =>
        prev?.shift ? { ...prev, shift: { ...prev.shift, tasks: [...prev.shift.tasks, task] } } : prev,
      )
      setTaskModalOpen(false)
      setTaskName('')
      setTaskNotes('')
      setShowExtra(false)
      setTaskError(null)
      setNow(new Date())
    },
    onError: (err) => setTaskError(extractError(err, 'Something went wrong.')),
  })

  const stopTaskMutation = useMutation({
    mutationFn: workLogApi.stopTask,
    onSuccess: (task) => {
      queryClient.setQueryData<TodayData>(['workLogSheet', 'today'], (prev) =>
        prev?.shift
          ? { ...prev, shift: { ...prev.shift, tasks: prev.shift.tasks.map((t) => (t.id === task.id ? task : t)) } }
          : prev,
      )
      setNow(new Date())
    },
  })

  const eveningShiftMutation = useMutation({
    mutationFn: workLogApi.toggleEveningShift,
    onSuccess: (shift) => queryClient.setQueryData<TodayData>(['workLogSheet', 'today'], (prev) => (prev ? { ...prev, shift } : prev)),
  })

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground text-sm">Loading work log…</p>
      </div>
    )
  }

  const { schedule, shift } = data
  const runningTask = shift?.tasks.find((t) => t.status === 'Running') ?? null

  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const activeBreak = schedule.breaks.find((b) => nowHHMM >= b.start && nowHHMM < b.end) ?? null

  let adherencePct = 0
  let axisStartMin = hhmmToMin(schedule.shiftStart)
  let axisEndMin = hhmmToMin(schedule.shiftEnd)
  let timelineTasks: TimelineTask[] = []

  if (shift) {
    const shiftStartDate = todayAt(schedule.shiftStart)
    const shiftEndDate = todayAt(schedule.shiftEnd)
    // While an evening shift is active and "now" has pushed past the normal shift end, the
    // display window keeps stretching (open-ended) to the next full hour boundary.
    let displayEnd = shiftEndDate
    if (shift.eveningShift && now > shiftEndDate) {
      const d = new Date(now)
      d.setMinutes(0, 0, 0)
      d.setHours(d.getHours() + 1)
      displayEnd = d
    }
    axisEndMin = displayEnd.getHours() * 60 + displayEnd.getMinutes()

    const clampedNow = now < shiftStartDate ? shiftStartDate : now > displayEnd ? displayEnd : now
    let scheduledMs = clampedNow.getTime() - shiftStartDate.getTime()
    for (const b of schedule.breaks) {
      const bs = todayAt(b.start)
      const be = todayAt(b.end)
      const overlapStart = new Date(Math.max(shiftStartDate.getTime(), bs.getTime()))
      const overlapEnd = new Date(Math.min(clampedNow.getTime(), be.getTime()))
      if (overlapEnd > overlapStart) scheduledMs -= overlapEnd.getTime() - overlapStart.getTime()
    }
    let workedMs = 0
    for (const t of shift.tasks) {
      const s = new Date(t.startTime)
      const e = t.endTime ? new Date(t.endTime) : now
      workedMs += Math.max(0, e.getTime() - s.getTime())
    }
    adherencePct = scheduledMs > 0 ? Math.min(100, Math.round((workedMs / scheduledMs) * 100)) : 0

    timelineTasks = shift.tasks.map((t) => {
      const s = new Date(t.startTime)
      const e = t.endTime ? new Date(t.endTime) : now
      return {
        taskName: t.taskName,
        startMin: s.getHours() * 60 + s.getMinutes(),
        endMin: e.getHours() * 60 + e.getMinutes(),
        running: t.status === 'Running',
      }
    })
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Clock className="text-brand-orange h-5 w-5" /> Work Log Sheet
        </h2>
        <div className="flex items-center gap-3">
          {shift && (
            <div className="text-brand-orange text-lg font-bold">
              Adherence: <span>{adherencePct}</span>%
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setWeekModalOpen(true)}>
            <CalendarRange className="mr-1.5 h-4 w-4" /> View Week
          </Button>
        </div>
      </div>

      {!shift ? (
        <div className="py-7 text-center">
          <p className="text-muted-foreground mb-3">
            You haven't logged in for today's shift ({schedule.shiftStart}–{schedule.shiftEnd}).
          </p>
          <Button onClick={() => startShiftMutation.mutate()} disabled={startShiftMutation.isPending}>
            <LogIn className="mr-2 h-4 w-4" /> Log In
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            <div className="w-20 shrink-0 text-sm leading-tight font-bold">
              {now.toLocaleDateString(undefined, { weekday: 'short' })}{' '}
              <span className="rounded bg-amber-400 px-1 py-0.5 text-[0.62rem] text-black">Today</span>
              <br />
              <span className="text-muted-foreground text-xs font-medium">
                {now.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <TimelineRow axisStartMin={axisStartMin} axisEndMin={axisEndMin} breaks={schedule.breaks} tasks={timelineTasks} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button size="sm" onClick={() => setTaskModalOpen(true)} disabled={!!runningTask || !!activeBreak}>
              <Play className="mr-1.5 h-4 w-4" /> Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              disabled={!runningTask || stopTaskMutation.isPending}
              onClick={() => runningTask && stopTaskMutation.mutate(runningTask.id)}
            >
              <Square className="mr-1.5 h-4 w-4" /> Stop / Complete
            </Button>
            {!shift.eveningShift ? (
              <Button size="sm" variant="outline" onClick={() => eveningShiftMutation.mutate()} disabled={eveningShiftMutation.isPending}>
                <Moon className="mr-1.5 h-4 w-4" /> Evening Shift
              </Button>
            ) : (
              <span className="border-brand-orange text-brand-orange inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-semibold">
                <Moon className="h-3.5 w-3.5" /> Evening Shift Active
              </span>
            )}
            {activeBreak && !runningTask && (
              <span className="text-destructive text-xs font-semibold">
                On {activeBreak.label} until {activeBreak.end} — task starting is paused.
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Evening Shift extends the timeline past {schedule.shiftEnd} for as long as you keep working.
          </p>
        </>
      )}

      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setTaskModalOpen(false)}>
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Start a Task</h3>
              <button onClick={() => setTaskModalOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                What will you be working on? <span className="text-destructive">*</span>
              </label>
              <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="e.g. Design review for JOB-004" />
            </div>

            <button type="button" className="text-primary mt-2 text-sm underline" onClick={() => setShowExtra((v) => !v)}>
              {showExtra ? 'Hide extra fields' : 'View all fields'}
            </button>

            {showExtra && (
              <div className="mt-2 space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                  rows={3}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Optional detail"
                />
              </div>
            )}

            {taskError && <p className="text-destructive mt-2 text-sm">{taskError}</p>}

            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!taskName.trim()) {
                    setTaskError('Task name is required.')
                    return
                  }
                  startTaskMutation.mutate({ taskName: taskName.trim(), taskNotes: taskNotes.trim() || undefined })
                }}
                disabled={startTaskMutation.isPending}
              >
                <Play className="mr-1.5 h-4 w-4" /> Start
              </Button>
            </div>
          </div>
        </div>
      )}

      {weekModalOpen && <WeekLogModal onClose={() => setWeekModalOpen(false)} />}
    </div>
  )
}
