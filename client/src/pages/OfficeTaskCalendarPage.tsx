import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as taskCalendarApi from '@/api/taskCalendar'
import * as usersApi from '@/api/users'
import type { CalendarItemType } from '@/api/taskCalendar'
import { useAuth } from '@/hooks/useAuth'

const TYPE_LABEL: Record<CalendarItemType, string> = {
  memo: 'To-Do',
  job_to_me: 'Assigned to you',
  job_by_me: 'You assigned',
}

const TYPE_COLOR: Record<CalendarItemType, string> = {
  memo: '#e74c3c',
  job_to_me: '#3498db',
  job_by_me: '#2ecc71',
}

const ALL_TYPES: CalendarItemType[] = ['memo', 'job_to_me', 'job_by_me']

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mondayOf(d: Date) {
  const offset = (d.getDay() + 6) % 7
  const m = new Date(d)
  m.setDate(d.getDate() - offset)
  return m
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function extractError(err: unknown, fallback: string) {
  return isAxiosError(err) ? ((err.response?.data as { error?: string } | undefined)?.error ?? fallback) : fallback
}

// Full-page "board" layout for the Office Task Calendar — restyled per Calvin's reference
// screenshot (a Monday.com-style calendar board): a left sidebar of toggleable calendar categories
// and a big day-column grid, rather than the compact dashboard widget (client/src/components/
// TaskCalendar.tsx, unchanged — still used embedded on the Super Admin dashboard). The reference's
// bars span multiple days and group by team; our Memos/Office Tasks only carry a single due date
// each and group naturally by item type instead, so this adapts to single-day colored chips grouped
// by type (To-Do / Assigned to you / You assigned) rather than literal multi-day bars. Per Calvin's
// choice, only this page's add-task form is a right-anchored slide-in panel instead of a centered
// modal — every other modal in the app is unchanged.
export default function OfficeTaskCalendarPage() {
  const { user } = useAuth()
  // Creating To-Dos/Jobs is Marketer + Super Admin (see MIGRATION_PLAN.md §21), plus Stores Admin
  // (§32 — assigns jobs to Logistics drivers/Production Team from here); everyone else gets a
  // view-only calendar (own memos, tasks assigned to/by them, still shown inline per day).
  const canManage = user?.role === 'Marketer' || user?.role === 'SuperAdmin' || user?.role === 'StoresAdmin'
  const queryClient = useQueryClient()
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState(() => toKey(new Date()))
  const [visibleTypes, setVisibleTypes] = useState<Record<CalendarItemType, boolean>>({
    memo: true,
    job_to_me: true,
    job_by_me: true,
  })

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
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
      closePanel()
    },
    onError: (err) => setFormError(extractError(err, 'Something went wrong.')),
  })
  const jobMutation = useMutation({
    mutationFn: taskCalendarApi.createOfficeTask,
    onSuccess: () => {
      invalidate()
      closePanel()
    },
    onError: (err) => setFormError(extractError(err, 'Something went wrong.')),
  })

  useEffect(() => {
    if (panelOpen) {
      const id = requestAnimationFrame(() => setPanelVisible(true))
      return () => cancelAnimationFrame(id)
    }
  }, [panelOpen])

  function openPanel(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00')
    const needsFetch = d.getFullYear() !== year || d.getMonth() + 1 !== month
    setSelectedDate(dateKey)
    if (needsFetch) setView(new Date(d.getFullYear(), d.getMonth(), 1))
    setModalType('todo')
    setTodoTitle('')
    setTodoTime('09:00')
    setTodoNotes('')
    setDepartment('')
    setAssigneeId('')
    setJobTitle('')
    setJobNotes('')
    setFormError(null)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelVisible(false)
    setTimeout(() => setPanelOpen(false), 200)
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

  const monthLabel = view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const todayKey = toKey(today)

  function submitTodo() {
    if (!todoTitle.trim()) {
      setFormError('Title is required.')
      return
    }
    memoMutation.mutate({ title: todoTitle.trim(), description: todoNotes.trim() || undefined, dueDate: `${selectedDate}T${todoTime || '09:00'}` })
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
    jobMutation.mutate({ title: jobTitle.trim(), description: jobNotes.trim() || undefined, dueDate: selectedDate, assignedToId: Number(assigneeId) })
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Office Task Calendar</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[9rem] text-center">{viewMode === 'month' ? monthLabel : `Week of ${cellDates[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}</span>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-0.5 rounded-full bg-secondary p-0.5">
            <button
              className={`rounded-full px-3 py-1 text-xs font-semibold ${viewMode === 'week' ? 'bg-brand-orange text-white' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`rounded-full px-3 py-1 text-xs font-semibold ${viewMode === 'month' ? 'bg-brand-orange text-white' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-5">
        {/* Left sidebar: toggleable calendar categories */}
        <div className="w-56 shrink-0 rounded-2xl border bg-card p-4">
          <h2 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">Calendars</h2>
          <div className="space-y-2.5">
            {ALL_TYPES.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={visibleTypes[t]}
                  onChange={(e) => setVisibleTypes((prev) => ({ ...prev, [t]: e.target.checked }))}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                {TYPE_LABEL[t]}
              </label>
            ))}
          </div>
          {canManage && (
            <Button size="sm" className="mt-4 w-full" onClick={() => openPanel(selectedDate)}>
              <Plus className="mr-1.5 h-4 w-4" /> New
            </Button>
          )}
        </div>

        {/* Main day-column grid */}
        <div className="min-w-0 flex-1 overflow-x-auto rounded-2xl border bg-card p-4">
          <div className="grid min-w-[700px] grid-cols-7 border-t border-l">
            {DOW_LABELS.map((d) => (
              <div key={d} className="text-muted-foreground border-r border-b bg-secondary/40 py-2 text-center text-xs font-semibold">
                {d}
              </div>
            ))}
            {cellDates.map((cellDate, i) => {
              const key = toKey(cellDate)
              const inMonth = viewMode === 'week' || cellDate.getMonth() === month - 1
              const isToday = key === todayKey
              const items = (byDate[key] ?? []).filter((it) => visibleTypes[it.type])
              const shown = items.slice(0, 3)
              const overflow = items.length - shown.length

              return (
                <div
                  key={i}
                  className={`min-h-[104px] border-r border-b p-1.5 ${inMonth ? '' : 'bg-secondary/20 opacity-50'} ${canManage ? 'cursor-pointer hover:bg-secondary/40' : ''}`}
                  onClick={canManage ? () => openPanel(key) : undefined}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-brand-orange text-white' : ''}`}
                    >
                      {cellDate.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {shown.map((it) => (
                      <div
                        key={`${it.type}-${it.id}`}
                        title={it.title}
                        className="bg-secondary truncate rounded border-l-4 px-1.5 py-0.5 text-[0.68rem] font-medium"
                        style={{ borderLeftColor: TYPE_COLOR[it.type] }}
                      >
                        {it.title}
                      </div>
                    ))}
                    {overflow > 0 && <div className="text-muted-foreground text-[0.65rem]">+{overflow} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right-anchored slide-in add-task panel (per Calvin's request — this page only) */}
      {panelOpen && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closePanel}
          />
          <div
            className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm overflow-y-auto border-l bg-card p-6 transition-transform duration-200 ${
              panelVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Add to {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={closePanel} aria-label="Close">
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

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={closePanel}>
                Cancel
              </Button>
              <Button onClick={modalType === 'todo' ? submitTodo : submitJob} disabled={memoMutation.isPending || jobMutation.isPending}>
                {memoMutation.isPending || jobMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
