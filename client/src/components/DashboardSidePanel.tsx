import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, BadgeCheck, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import * as ordersApi from '@/api/orders'
import * as boqApi from '@/api/boq'
import { TaskCalendar } from '@/components/TaskCalendar'
import { LogoWatermark } from '@/components/LogoWatermark'

// Translated from the "Selena Academy" reference template's right column (profile card, calendar,
// "Schedule class" list) that the Super Admin Dashboard was originally built from (see
// MIGRATION_PLAN.md §10.1/§10.4). Calvin asked to keep this column visible "exactly where it is" on
// every page, not just the dashboard — so it now lives in AppShell as a persistent right rail
// instead of being assembled per-page. `totalJobs`/`currentJobs` are derived client-side from
// orders already cached under the ['orders'] query key (shared with OrdersKanban/ManageOrders, so
// no extra network round-trip when those pages are also open). The dummy 4.8 rating is a genuine
// legacy placeholder — not something to make "real".
export function DashboardSidePanel() {
  const { user } = useAuth()
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const { data: boqs } = useQuery({ queryKey: ['boqs'], queryFn: boqApi.list })

  const totalJobs = user ? (orders ?? []).filter((o) => o.assignedUsers.some((u) => u.id === user.id)).length : 0
  const currentJobs = user
    ? (orders ?? []).filter((o) => o.assignedUsers.some((u) => u.id === user.id) && o.status !== 'Completed').length
    : 0
  const recentBoqs = (boqs ?? []).slice(0, 5)

  return (
    <div className="flex w-full flex-col gap-5 xl:w-80">
      <div className="from-sidebar-from to-sidebar-to relative overflow-hidden rounded-2xl bg-gradient-to-b p-6 text-center text-white">
        <LogoWatermark />
        <div className="relative z-10">
          <div className="border-brand-orange relative mx-auto mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] bg-white/10">
            <User className="h-8 w-8" />
            <span className="bg-brand-orange absolute -right-0.5 -bottom-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white text-white">
              <BadgeCheck className="h-3 w-3" />
            </span>
          </div>
          <h3 className="font-bold">
            {user?.name} {user?.surname}
          </h3>
          <div className="mb-4 text-xs text-white/70">{user?.role}</div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-white/10 px-1 py-2.5">
              <strong className="block text-base">{totalJobs}</strong>
              <span className="text-[0.66rem] text-white/70">Total Jobs</span>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 px-1 py-2.5">
              <strong className="block text-base">{currentJobs}</strong>
              <span className="text-[0.66rem] text-white/70">Current Jobs</span>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 px-1 py-2.5">
              <strong className="block text-base">4.8</strong>
              <span className="text-[0.66rem] text-white/70">Rating</span>
            </div>
          </div>
        </div>
      </div>

      <TaskCalendar />

      <div className="rounded-2xl border bg-card p-5">
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
                <div className="bg-secondary shrink-0 rounded-[10px] border px-2.5 py-1.5 text-center leading-tight">
                  <strong className="block text-sm">{new Date(b.createdAt).getDate()}</strong>
                  <span className="text-muted-foreground text-[0.6rem] uppercase">
                    {new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
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
  )
}
