import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import * as ordersApi from '@/api/orders'
import { OrderCard } from '@/components/OrderCard'
import { WorkLogSheet } from '@/components/WorkLogSheet'
import { PageHeader } from '@/components/ui/page-header'

const TABS = [
  { key: 'new' as const, label: 'New Orders' },
  { key: 'ongoing' as const, label: 'On Going' },
  { key: 'completed' as const, label: 'Completed' },
]

// Translated from orders.php — the working kanban view embedded on every dashboard in the legacy
// app (distinct from manageOrder.php/manageOrderP.php's separate Add/Edit/View tabs — see /orders/manage).
// Rebuilt on the shared PageHeader primitive as part of the full-app redesign sweep (see
// MIGRATION_PLAN.md §10.11), then restyled to match the admin dashboard's Orders section
// (SuperAdminDashboard.tsx's OrdersCarousel) per Calvin's reference screenshots — same
// chevron-arrow tab switcher instead of a row of pill buttons, same card container.
export default function OrdersKanban() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: ordersApi.list })
  const [index, setIndex] = useState(0)
  const tab = TABS[index]

  const groups = {
    new: orders?.filter((o) => o.status === 'New' || o.status === 'Assigned') ?? [],
    ongoing: orders?.filter((o) => o.status === 'OnGoing') ?? [],
    completed: orders?.filter((o) => o.status === 'Completed') ?? [],
  }
  const items = groups[tab.key]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 md:p-8">
      <PageHeader title="Manage Orders" />

      {/* Same rounded-2xl bordered "card" wrapper + arrow-cycling tab header the admin dashboard
          uses for its Orders section (see SuperAdminDashboard.tsx's OrdersCarousel), for consistent
          dashboard chrome across roles. */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Orders</h2>
          <div className="flex items-center gap-2">
            <button
              className="hover:bg-brand-orange flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:text-white"
              onClick={() => setIndex((i) => (i - 1 + TABS.length) % TABS.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-muted-foreground min-w-[100px] text-center text-xs font-semibold">
              {tab.label} ({items.length})
            </span>
            <button
              className="hover:bg-brand-orange flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:text-white"
              onClick={() => setIndex((i) => (i + 1) % TABS.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {!isLoading && items.length === 0 && (
          <div className="text-muted-foreground py-10 text-center text-sm">
            <Inbox className="mx-auto mb-2 h-8 w-8" />
            Nothing here yet.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>

      <WorkLogSheet />
    </div>
  )
}
