import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Zap, HardHat, CircleCheck, Inbox, Clock, FileSignature, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as ordersApi from '@/api/orders'
import * as requisitionsApi from '@/api/requisitions'
import * as quotationsApi from '@/api/quotations'
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
              <Link to="/orders/manage" className="text-foreground mt-auto self-start rounded-full bg-white px-3 py-1 text-xs font-bold">
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Translated from superDashboard.php (scoped from feature/work-log-sheet, see MIGRATION_PLAN.md
// §10) — orders carousel, Work Log Sheet, and pending requisitions/quotations quick-actions. The
// profile card / calendar / BOQ list that used to live in a side column here now live in
// `DashboardSidePanel`, rendered globally by `AppShell` on every page (see §10.10) instead of being
// assembled per-page.
export default function SuperAdminDashboard() {
  const queryClient = useQueryClient()
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const { data: requisitions } = useQuery({ queryKey: ['requisitions'], queryFn: requisitionsApi.list })
  const { data: quotations } = useQuery({ queryKey: ['quotations'], queryFn: quotationsApi.list })

  const processMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.process(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requisitions'] }),
  })
  const approveMutation = useMutation({
    mutationFn: (id: number) => quotationsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  })

  const pendingRequisitions = (requisitions ?? []).filter((r) => r.status === 'Pending').slice(0, 6)
  const pendingQuotations = (quotations ?? []).filter((q) => q.status === 'Pending').slice(0, 6)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-8">
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
  )
}
