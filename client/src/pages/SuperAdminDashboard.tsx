import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  HardHat,
  CircleCheck,
  Inbox,
  Clock,
  FileSignature,
  FileSpreadsheet,
  User,
  BadgeCheck,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import * as ordersApi from '@/api/orders'
import * as requisitionsApi from '@/api/requisitions'
import * as quotationsApi from '@/api/quotations'
import * as boqApi from '@/api/boq'
import type { Order } from '@/api/orders'
import { WorkLogSheet } from '@/components/WorkLogSheet'

const ORDER_TABS = [
  { key: 'new' as const, label: 'New Orders', icon: Zap, gradient: 'from-brand-orange to-brand-orange-dark' },
  { key: 'ongoing' as const, label: 'On Going', icon: HardHat, gradient: 'from-brand-purple to-brand-purple-dark' },
  { key: 'completed' as const, label: 'Completed', icon: CircleCheck, gradient: 'from-emerald-500 to-emerald-700' },
]

function OrdersCarousel({ orders }: { orders: Order[] }) {
  const groups = useMemo(
    () => ({
      new: orders.filter((o) => o.status === 'New' || o.status === 'Assigned'),
      ongoing: orders.filter((o) => o.status === 'OnGoing'),
      completed: orders.filter((o) => o.status === 'Completed'),
    }),
    [orders],
  )
  const [index, setIndex] = useState(0)
  const tab = ORDER_TABS[index]
  const items = groups[tab.key].slice(0, 6)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Orders</h2>
        <div className="flex items-center gap-2">
          <button
            className="hover:bg-brand-orange flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:text-white"
            onClick={() => setIndex((i) => (i - 1 + ORDER_TABS.length) % ORDER_TABS.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-muted-foreground min-w-[100px] text-center text-xs font-semibold">
            {tab.label} ({groups[tab.key].length})
          </span>
          <button
            className="hover:bg-brand-orange flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:text-white"
            onClick={() => setIndex((i) => (i + 1) % ORDER_TABS.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-muted-foreground py-10 text-center text-sm">
          <Inbox className="mx-auto mb-2 h-8 w-8" />
          Nothing here yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((o) => (
            <div key={o.id} className={`flex min-h-[150px] flex-col gap-2.5 rounded-2xl bg-gradient-to-br p-4 text-white ${tab.gradient}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/20">
                <tab.icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold">{o.orderName}</h3>
              <div className="text-xs opacity-90">
                {o.orderNumber} · {o.location}
              </div>
              <div className="text-xs opacity-90">
                <Clock className="mr-1 inline h-3 w-3" />
                {o.deadlineDatetime
                  ? new Date(o.deadlineDatetime).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'No deadline'}
              </div>
              <Link to="/orders/manage" className="text-ink mt-auto self-start rounded-full bg-white px-3 py-1 text-xs font-bold">
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function MiniCalendar({ markedDates }: { markedDates: Set<string> }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const today = new Date()

  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), inMonth: true })
  while (cells.length % 7 !== 0) {
    const next = new Date(cells[cells.length - 1].date)
    next.setDate(next.getDate() + 1)
    cells.push({ date: next, inMonth: false })
  }

  return (
    <div className="bg-ink rounded-2xl p-4 text-white">
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <button
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span>{monthLabel}</span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="pb-1.5 font-semibold opacity-50">
            {d}
          </div>
        ))}
        {cells.map(({ date, inMonth }, i) => {
          const isToday = date.toDateString() === today.toDateString()
          const marked = markedDates.has(dateKey(date))
          return (
            <div key={i} className={`relative rounded-lg py-1.5 ${inMonth ? '' : 'opacity-40'} ${isToday ? 'bg-brand-orange font-bold' : ''}`}>
              {date.getDate()}
              {marked && (
                <span
                  className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isToday ? 'bg-white' : 'bg-brand-purple'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Translated from superDashboard.php (scoped from feature/work-log-sheet, see MIGRATION_PLAN.md
// §10) — orders carousel, Work Log Sheet, pending requisitions/quotations quick-actions, profile
// stats, deadline calendar, and recent BOQs. `totalJobs`/`currentJobs` are derived client-side from
// the orders already fetched for the carousel (each order carries its assignedUsers) rather than a
// new aggregate endpoint, since the data is already on the page. The dummy 4.8 rating is a genuine
// legacy placeholder — not something to make "real".
export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const { data: requisitions } = useQuery({ queryKey: ['requisitions'], queryFn: requisitionsApi.list })
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list })
  const { data: boqs } = useQuery({ queryKey: ['boqs'], queryFn: boqApi.list })

  const processMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.process(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requisitions'] }),
  })
  const approveMutation = useMutation({
    mutationFn: (id: number) => quotationsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  })

  const totalJobs = user ? (orders ?? []).filter((o) => o.assignedUsers.some((u) => u.id === user.id)).length : 0
  const currentJobs = user
    ? (orders ?? []).filter((o) => o.assignedUsers.some((u) => u.id === user.id) && o.status !== 'Completed').length
    : 0

  const markedDates = useMemo(() => {
    const set = new Set<string>()
    for (const o of orders ?? []) {
      if (o.deadlineDatetime) set.add(dateKey(new Date(o.deadlineDatetime)))
    }
    return set
  }, [orders])

  const pendingRequisitions = (requisitions ?? []).filter((r) => r.status === 'Pending').slice(0, 6)
  const pendingQuotations = (quotations ?? []).filter((q) => q.status === 'Pending').slice(0, 6)
  const recentBoqs = (boqs ?? []).slice(0, 5)

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 p-4 md:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main column */}
      <div className="flex min-w-0 flex-col gap-5">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <OrdersCarousel orders={orders ?? []} />
        </div>

        <WorkLogSheet />

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Pending Requisitions</h2>
            <Link to="/requisitions/process" className="text-brand-orange text-sm font-semibold">
              See All
            </Link>
          </div>
          {pendingRequisitions.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-sm">No pending requisitions right now.</div>
          ) : (
            <div className="space-y-2.5">
              {pendingRequisitions.map((r) => (
                <div key={r.id} className="bg-secondary flex items-center gap-3.5 rounded-2xl px-4 py-3">
                  <div className="from-brand-orange to-brand-purple flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white">
                    <FileSignature className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-brand-purple text-[0.68rem] font-bold tracking-wide uppercase">{r.displayType}</div>
                    <div className="truncate text-sm font-semibold">
                      {r.eventName} — {r.projectManager}
                    </div>
                  </div>
                  <div className="text-muted-foreground hidden shrink-0 rounded-full bg-card px-3 py-1.5 text-xs sm:block">
                    {new Date(r.eventDate).toLocaleDateString()}
                  </div>
                  <Button size="sm" onClick={() => processMutation.mutate(r.id)} disabled={processMutation.isPending}>
                    Process
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Pending Quotations</h2>
            <Link to="/quotations/process" className="text-brand-orange text-sm font-semibold">
              See All
            </Link>
          </div>
          {pendingQuotations.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-sm">No pending quotations right now.</div>
          ) : (
            <div className="space-y-2.5">
              {pendingQuotations.map((q) => (
                <div key={q.id} className="bg-secondary flex items-center gap-3.5 rounded-2xl px-4 py-3">
                  <div className="from-brand-orange to-brand-purple flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-brand-purple text-[0.68rem] font-bold tracking-wide uppercase">{q.quotationNumber}</div>
                    <div className="truncate text-sm font-semibold">
                      {q.customerName}
                      {q.projectName ? ` — ${q.projectName}` : ''}
                    </div>
                  </div>
                  <div className="text-muted-foreground hidden shrink-0 rounded-full bg-card px-3 py-1.5 text-xs sm:block">
                    {new Date(q.quoteDate).toLocaleDateString()}
                  </div>
                  <Button size="sm" onClick={() => approveMutation.mutate(q.id)} disabled={approveMutation.isPending}>
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side column */}
      <div className="flex min-w-0 flex-col gap-5">
        <div className="from-ink to-brand-purple-dark rounded-2xl bg-gradient-to-br p-6 text-center text-white">
          <div className="relative mx-auto mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-white/35 bg-white/10">
            <User className="h-8 w-8" />
            <span className="bg-brand-orange border-ink absolute -right-0.5 -bottom-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2">
              <BadgeCheck className="h-3 w-3" />
            </span>
          </div>
          <h3 className="font-bold">
            {user?.name} {user?.surname}
          </h3>
          <div className="mb-4 text-xs opacity-75">{user?.role}</div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-white/10 px-1 py-2.5">
              <strong className="block text-base">{totalJobs}</strong>
              <span className="text-[0.66rem] opacity-75">Total Jobs</span>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 px-1 py-2.5">
              <strong className="block text-base">{currentJobs}</strong>
              <span className="text-[0.66rem] opacity-75">Current Jobs</span>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 px-1 py-2.5">
              <strong className="block text-base">4.8</strong>
              <span className="text-[0.66rem] opacity-75">Rating</span>
            </div>
          </div>
        </div>

        <MiniCalendar markedDates={markedDates} />

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Bill of Quantities</h2>
            <Link to="/orders/manage" className="text-brand-orange text-sm font-semibold">
              See All
            </Link>
          </div>
          {recentBoqs.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-sm">No BOQs saved yet.</div>
          ) : (
            <div className="divide-y">
              {recentBoqs.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="bg-ink shrink-0 rounded-[10px] px-2.5 py-1.5 text-center leading-tight text-white">
                    <strong className="block text-sm">{new Date(b.createdAt).getDate()}</strong>
                    <span className="text-[0.6rem] opacity-75 uppercase">{new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{b.eventName}</div>
                    <div className="text-muted-foreground text-xs">
                      BOQ #{b.boqNumber} · {b.orderNumber}
                    </div>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-brand-orange shrink-0"
                    title="Download PDF"
                    onClick={() => {
                      boqApi.downloadPdf(b.id, b.boqNumber).catch(() => {})
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
