import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as taskCalendarApi from '@/api/taskCalendar'
import * as usersApi from '@/api/users'
import type { CalendarItem, CalendarItemType } from '@/api/taskCalendar'
import { LogoWatermark } from '@/components/LogoWatermark'

const TYPE_LABEL: Record<CalendarItemType, string> = {
  memo: 'To-Do',
  job_to_me: 'Assigned to you',
  job_by_me: 'You assigned',
}

const DOT_COLOR: Record<CalendarItemType, string> = {
  memo: '#e74c3c',
  job_to_me: '#3498db',
  job_by_me: '#2ecc71',
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mondayOf(d: Date) {
  const offset = (d.getDay() + 6) % 7
  const m = new Date(d)
  m.setDate(d.getDate() - offset)
  return m
}

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function extractError(err: unknown, fallback: string) {
  return isAxiosError(err) ? ((err.response?.data as { error?: string } | undefined)?.error ?? fallback) : fallback
}

// Translated from custom/js/task-calendar.js + superDashboard.php's #dashCalendar (scoped from
// feature/office-task-calendar, never merged to main — see MIGRATION_PLAN.md §10). Replaces the
// plain marked-date mini calendar with the "family calendar" style: month/week grid with colored
// dots (red = To-Do, blue = assigned to you, green = you assigned), a day panel listing that
// date's items, and a modal to add either a personal To-Do (memo) or a Job (office task assigned
// to any user/department). Polls every 25s like the legacy widget so a newly-assigned job shows up
// without a reload.
export function TaskCalendar() {
  const queryClient = useQueryClient()
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState(() => toKey(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'todo' | 'job'>('todo')
  const [todoTitle, setTodoTitle] = useState('')
  const [todoTime, setTodoTime] = useState('09:00')
  const [todoNotes, setTodoNotes] = useState('')
  const [department, setDepartment] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobNotes, setJobNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const year = view.getFullYear()
  const month = view.getMonth() + 1

  const { data } = useQuery({
    queryKey: ['taskCalendar', year, month],
    queryFn: () => taskCalendarApi.getCalendar(year, month),
    refetchInterval: 25000,
  })
  const byDate = data?.byDate ?? {}

  const { data: users } = useQuery({ queryKey: ['users', 'assignable'], queryFn: usersApi.listAssignable })
  const departments = useMemo(() => Array.from(new Set((users ?? []).map((u) => u.department))), [users])
  const assignees = useMemo(() => (users ?? []).filter((u) => u.department === department), [users, department])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['taskCalendar'] })

  const memoMutation = useMutation({
    mutationFn: taskCalendarApi.quickAddMemo,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
    onError: (err) => setFormError(extractError(err, 'Something went wrong.')),
  })
  const jobMutation = useMutation({
    mutationFn: taskCalendarApi.createOfficeTask,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
    onError: (err) => setFormError(extractError(err, 'Something went wrong.')),
  })

  function openModalFor(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00')
    const needsFetch = d.getFullYear() !== year || d.getMonth() + 1 !== month
    setSelectedDate(dateKey)
    if (needsFetch) {
      const nv = new Date(d.getFullYear(), d.getMonth(), 1)
      setView(nv)
    }
    setModalType('todo')
    setTodoTitle('')
    setTodoTime('09:00')
    setTodoNotes('')
    setDepartment('')
    setAssigneeId('')
    setJobTitle('')
    setJobNotes('')
    setFormError(null)
    setModalOpen(true)
  }

  function selectDate(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00')
    setSelectedDate(dateKey)
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) {
      setView(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }

  function goPrev() {
    if (viewMode === 'month') {
      setView(new Date(year, month - 2, 1))
    } else {
      const d = new Date(selectedDate + 'T00:00:00')
      d.setDate(d.getDate() - 7)
      selectDate(toKey(d))
    }
  }
  function goNext() {
    if (viewMode === 'month') {
      setView(new Date(year, month, 1))
    } else {
      const d = new Date(selectedDate + 'T00:00:00')
      d.setDate(d.getDate() + 7)
      selectDate(toKey(d))
    }
  }

  const cellDates: Date[] = useMemo(() => {
    if (viewMode === 'month') {
      const firstDay = new Date(year, month - 1, 1)
      const gridStart = mondayOf(firstDay)
      return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart)
        d.setDate(gridStart.getDate() + i)
        return d
      })
    }
    const selDate = new Date(selectedDate + 'T00:00:00')
    const weekStart = mondayOf(selDate)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }, [viewMode, year, month, selectedDate])

  const monthLabel =
    viewMode === 'month'
      ? view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : (() => {
          const start = cellDates[0]
          const end = cellDates[6]
          const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return `${fmt(start)} - ${fmt(end)}`
        })()

  const todayKey = toKey(today)
  const dayItems = (byDate[selectedDate] ?? []).slice().sort((a, b) => a.type.localeCompare(b.type))

  function submitTodo() {
    if (!todoTitle.trim()) {
      setFormError('Title is required.')
      return
    }
    memoMutation.mutate({
      title: todoTitle.trim(),
      description: todoNotes.trim() || undefined,
      dueDate: `${selectedDate}T${todoTime || '09:00'}`,
    })
  }

  function submitJob() {
    if (!department) {
      setFormError('Please select a department.')
      return
    }
    if (!assigneeId) {
      setFormError('Please select who to assign this to.')
      return
    }
    if (!jobTitle.trim()) {
      setFormError('Task is required.')
      return
    }
    jobMutation.mutate({
      title: jobTitle.trim(),
      description: jobNotes.trim() || undefined,
      dueDate: selectedDate,
      assignedToId: Number(assigneeId),
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-4">
      <LogoWatermark />
      <div className="relative z-10">
        <div className="mb-3.5 flex items-center justify-between text-sm font-bold">
          <div className="flex items-center gap-2">
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary" onClick={goPrev}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>{monthLabel}</span>
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary" onClick={goNext}>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-0.5 rounded-full bg-secondary p-0.5">
            <button
              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${viewMode === 'week' ? 'bg-brand-orange text-white' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${viewMode === 'month' ? 'bg-brand-orange text-white' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DOW.map((d, i) => (
            <div key={i} className="text-muted-foreground pb-1.5 text-[0.66rem] font-semibold opacity-70">
              {d}
            </div>
          ))}
          {cellDates.map((cellDate, i) => {
            const key = toKey(cellDate)
            const inMonth = viewMode === 'week' || cellDate.getMonth() === month - 1
            const isToday = key === todayKey
            const isSelected = key === selectedDate
            const items = byDate[key] ?? []
            const seenTypes = Array.from(new Set(items.map((it) => it.type)))
            const titleAttr = items.map((it) => `${TYPE_LABEL[it.type]}: ${it.title}`).join('\n')

            return (
              <button
                key={i}
                title={titleAttr || undefined}
                className={`relative min-h-[40px] cursor-pointer rounded-lg py-2 ${inMonth ? '' : 'opacity-40'} ${
                  isSelected ? 'bg-indigo-50' : 'hover:bg-secondary'
                }`}
                onClick={() => {
                  selectDate(key)
                  openModalFor(key)
                }}
              >
                <span
                  className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-full ${
                    isToday ? 'bg-brand-orange font-bold text-white' : isSelected ? 'border-brand-orange border-[1.5px] font-bold' : ''
                  }`}
                >
                  {cellDate.getDate()}
                </span>
                {seenTypes.length > 0 && (
                  <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                    {seenTypes.map((t) => (
                      <span key={t} className="h-1 w-1 rounded-full" style={{ background: DOT_COLOR[t] }} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 border-t pt-3.5">
          {dayItems.length === 0 ? (
            <div className="text-muted-foreground py-2.5 text-center text-xs">Nothing scheduled.</div>
          ) : (
            <div className="space-y-1.5">
              {dayItems.map((it: CalendarItem) => {
                let sub = TYPE_LABEL[it.type]
                if (it.type === 'job_to_me' && it.other) sub += ` — from ${it.other}`
                if (it.type === 'job_by_me' && it.other) sub += ` — to ${it.other}`
                return (
                  <div
                    key={`${it.type}-${it.id}`}
                    className="bg-secondary/60 flex items-center gap-2.5 rounded-lg border-l-4 px-2.5 py-2"
                    style={{ borderLeftColor: DOT_COLOR[it.type] }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold" title={it.title}>
                        {it.title}
                      </div>
                      <div className="text-muted-foreground text-[0.68rem]">{sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-lg border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Add to {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setModalOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex gap-2 rounded-full bg-secondary p-1">
              <button
                className={`flex-1 rounded-full py-1.5 text-sm font-semibold ${modalType === 'todo' ? 'bg-brand-orange text-white' : 'text-muted-foreground'}`}
                onClick={() => setModalType('todo')}
              >
                To-Do
              </button>
              <button
                className={`flex-1 rounded-full py-1.5 text-sm font-semibold ${modalType === 'job' ? 'bg-brand-orange text-white' : 'text-muted-foreground'}`}
                onClick={() => setModalType('job')}
              >
                Job
              </button>
            </div>

            {modalType === 'todo' ? (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} placeholder="e.g. Follow up with printer" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Time</label>
                  <Input type="time" value={todoTime} onChange={(e) => setTodoTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    rows={2}
                    value={todoNotes}
                    onChange={(e) => setTodoNotes(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="border-input flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value)
                      setAssigneeId('')
                    }}
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Assign To <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="border-input flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm disabled:opacity-50"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={!department}
                  >
                    <option value="">{department ? 'Select person...' : 'Select department first...'}</option>
                    {assignees.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.surname}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Task <span className="text-destructive">*</span>
                  </label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Prepare signage artwork" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    rows={2}
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {formError && <p className="text-destructive mt-2 text-sm">{formError}</p>}

            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={modalType === 'todo' ? submitTodo : submitJob} disabled={memoMutation.isPending || jobMutation.isPending}>
                {memoMutation.isPending || jobMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
